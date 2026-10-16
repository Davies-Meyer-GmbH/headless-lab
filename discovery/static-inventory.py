#!/usr/bin/env python3
"""Static inventory for the discovery stage.

Parses every content page of a dm-frontend static build and reports:
- top-level sections per page (tag, BEM block, heading, media, repeated items)
- one structure signature per section instance; same block with different
  signatures on different pages is reported as a variant, not a new section
- page types: pages with the same section-block sequence are one page type
- the SCSS partial matching each BEM block, and blocks present on every page

Read-only. Only writes the JSON report given with --out.

Usage:
    python3 static-inventory.py [--src alpina-be-frontend] [--out discovery/out/static.json]
"""

import argparse
import difflib
import hashlib
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

MEDIA_TAGS = {"img", "picture", "source", "video"}
FORM_TAGS = {"form", "input", "select", "textarea", "button"}
SECTION_TAGS = {"header", "footer", "section", "article", "main"}
INDEX_PAGES = {"pages.html"}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input",
             "link", "meta", "param", "source", "track", "wbr"}


def parse_page(path):
    """Parse with explicit depth tracking (simpler than the class above)."""
    html = path.read_text(encoding="utf-8")

    class P(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=True)
            self.depth = 0
            self.sections = []
            self.cur = None
            self.sec_depth = 0

        def handle_starttag(self, tag, attrs):
            d = dict(attrs)
            classes = d.get("class", "").split()
            if self.cur is None and tag in SECTION_TAGS and tag != "main" and classes:
                self.cur = {
                    "tag": tag, "block": classes[0], "classes": classes,
                    "labelledby": d.get("aria-labelledby", ""), "id": d.get("id", ""),
                    "heading": "", "heading_tag": "", "tokens": [],
                    "media": set(), "classnames": {}, "links": 0,
                    "capture": False,
                }
                self.sec_depth = self.depth
            if self.cur is not None:
                s = self.cur
                if tag in MEDIA_TAGS:
                    s["tokens"].append("MEDIA:" + tag)
                    s["media"].add("video" if tag == "video" else "image")
                elif tag == "form":
                    s["tokens"].append("form")
                    s["media"].add("form")
                elif tag == "a" and d.get("href") is not None:
                    s["links"] += 1
                    s["tokens"].append("a")
                elif tag in ("h1", "h2", "h3", "p", "ul", "ol", "li", "div",
                             "span", "section", "article", "header", "footer", "nav"):
                    s["tokens"].append(tag + "." + (classes[0] if classes else "-"))
                for c in classes:
                    s["classnames"][c] = s["classnames"].get(c, 0) + 1
                if tag in ("h1", "h2") and not s["heading"]:
                    s["heading_tag"] = tag
                    s["capture"] = True
            if tag not in VOID_TAGS:
                self.depth += 1

        def handle_data(self, data):
            if self.cur is not None and self.cur["capture"]:
                t = " ".join(data.split())
                if t:
                    self.cur["heading"] += t + " "

        def handle_endtag(self, tag):
            if tag not in VOID_TAGS:
                self.depth -= 1
            if self.cur is not None and self.depth == self.sec_depth and tag == self.cur["tag"]:
                s = self.cur
                s.pop("capture", None)
                s["heading"] = " ".join(s["heading"].split())[:120]
                s["signature"] = hashlib.sha1(
                    "|".join(s["tokens"]).encode()).hexdigest()[:10]
                s["media"] = sorted(s["media"])
                self.sections.append(s)
                self.cur = None
            if self.cur is not None and self.cur.get("capture") and tag in ("h1", "h2"):
                self.cur["capture"] = False

    p = P()
    p.feed(html)
    return p.sections


def find_scss(src, block):
    for sub in ("layout", "components"):
        cand = src / "src" / "scss" / sub / f"_{block}.scss"
        if cand.exists():
            return str(cand.relative_to(src))
    return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="alpina-be-frontend")
    ap.add_argument("--out", default="discovery/out/static.json")
    args = ap.parse_args()

    src = Path(args.src)
    pages = sorted(f for f in src.glob("*.html") if f.name not in INDEX_PAGES)
    if not pages:
        sys.exit(f"no pages in {src}")
    index_note = "pages.html is a page index, excluded from page types" if (
        src / "pages.html").exists() else ""

    report = {"source": str(src), "pages": {}, "sections": {},
              "page_types": [], "index_note": index_note}
    for page in pages:
        secs = parse_page(page)
        report["pages"][page.stem] = {"sections": [
            {k: s[k] for k in ("tag", "block", "heading", "heading_tag",
                               "media", "links", "signature")}
            for s in secs]}
        for s in secs:
            entry = report["sections"].setdefault(s["block"], {
                "pages": [], "signatures": {}, "scss": find_scss(src, s["block"]),
                "repeated": {}})
            if page.stem not in entry["pages"]:
                entry["pages"].append(page.stem)
            sig = entry["signatures"].setdefault(s["signature"], {
                "pages": [], "media": s["media"], "example_heading": s["heading"]})
            if page.stem not in sig["pages"]:
                sig["pages"].append(page.stem)
            for cls, count in s["classnames"].items():
                if count > 1 and (cls.startswith(s["block"] + "__") or (
                        "." not in cls and cls != s["block"] and count > 2)):
                    rep = entry["repeated"].setdefault(cls, {"count": 0, "pages": []})
                    rep["count"] = max(rep["count"], count)
                    if page.stem not in rep["pages"]:
                        rep["pages"].append(page.stem)

    n_pages = len(report["pages"])
    for block, entry in report["sections"].items():
        entry["global"] = len(entry["pages"]) == n_pages
        entry["variant"] = len(entry["signatures"]) > 1
        counts = {}
        for name, page in report["pages"].items():
            n = sum(1 for s in page["sections"] if s["block"] == block)
            if n:
                counts[name] = n
        entry["instances_per_page"] = counts

    # Explain structural variants: first token difference between signatures.
    token_lists = {}
    for page in pages:
        for s in parse_page(page):
            token_lists.setdefault(
                (s["block"], s["signature"]), s["tokens"])
    for block, entry in report["sections"].items():
        sigs = sorted(entry["signatures"])
        notes = []
        for i in range(len(sigs)):
            for j in range(i + 1, len(sigs)):
                a = token_lists.get((block, sigs[i]), [])
                b = token_lists.get((block, sigs[j]), [])
                sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
                for tag, a0, a1, b0, b1 in sm.get_opcodes():
                    if tag != "equal":
                        notes.append({
                            "between": [sigs[i], sigs[j]],
                            "at_token": max(a0, b0),
                            "a": a[max(0, a0 - 3):a1 + 3],
                            "b": b[max(0, b0 - 3):b1 + 3],
                        })
                        break
        entry["variant_notes"] = notes

    type_groups = {}
    for name, page in report["pages"].items():
        key = tuple(s["block"] for s in page["sections"])
        type_groups.setdefault(key, []).append(name)
    report["page_types"] = [
        {"pages": sorted(names), "structure": list(key)}
        for key, names in sorted(type_groups.items(), key=lambda kv: kv[1])]

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")

    print(f"pages: {n_pages}  sections: {len(report['sections'])}  "
          f"page types: {len(report['page_types'])}  -> {out}")
    print("\nPage types (same section sequence = one page type):")
    for t in report["page_types"]:
        print(f"  {', '.join(t['pages'])}")
    print("\nSections (G = on every page, V = has variants):")
    for block in sorted(report["sections"]):
        e = report["sections"][block]
        print(f"  {block:22s} pages={len(e['pages']):2d} "
              f"{'G' if e['global'] else ' '} "
              f"{'V' if e['variant'] else ' '} scss={e['scss'] or 'MISSING'}")


if __name__ == "__main__":
    main()
