#!/usr/bin/env python3
"""Discovery report builder.

Reads discovery/out/static.json, discovery/out/drupal.json and
discovery/mapping.json, and writes discovery/out/discovery-report.html.
The script only assembles data; the page renders it with plain JavaScript
from discovery/report-template.html. Screenshots stay as relative files
under discovery/out/shots/.

Usage: python3 discovery/report.py [--out discovery/out/discovery-report.html]
"""

import argparse
import json
import subprocess
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = HERE / 'out'


def page_type_id(pages):
    """Name a page type after its base page, ignoring variant suffixes."""
    base = sorted(pages, key=lambda p: (p.endswith('-video'), p))[0]
    return base


def page_type_label(type_id):
    return 'Homepage' if type_id == 'index' else type_id.replace('-', ' ').capitalize()


def media_variants(type_pages, structure, static_pages):
    """Plain-language notes where pages of one type differ in section media."""
    notes = []
    base = page_type_id(type_pages)
    for other in type_pages:
        if other == base:
            continue
        a = static_pages[base]['sections']
        b = static_pages[other]['sections']
        for i, block in enumerate(structure):
            if i >= len(a) or i >= len(b):
                break
            ma, mb = sorted(set(a[i]['media'])), sorted(set(b[i]['media']))
            if ma != mb:
                notes.append({
                    'page': other, 'block': block,
                    'text': f"{', '.join(mb) or 'no media'} instead of {', '.join(ma) or 'no media'}",
                })
    return notes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(OUT / 'discovery-report.html'))
    args = ap.parse_args()

    static = json.loads((OUT / 'static.json').read_text(encoding='utf-8'))
    drupal = json.loads((OUT / 'drupal.json').read_text(encoding='utf-8'))
    mapping = json.loads((HERE / 'mapping.json').read_text(encoding='utf-8'))
    by_block = {m['block']: m for m in mapping['mappings']}
    try:
        dev = subprocess.check_output(['git', 'config', 'user.name'], cwd=ROOT, text=True).strip()
    except (subprocess.SubprocessError, OSError):
        dev = 'unknown'

    components = {}
    for block, entry in static['sections'].items():
        m = by_block.get(block, {})
        shots = [f'shots/{block}.png']
        if (OUT / 'shots' / f'{block}-video.png').exists():
            shots.append(f'shots/{block}-video.png')
        components[block] = {
            'block': block,
            'component': m.get('component', ''),
            'status': m.get('status', 'component-only'),
            'verified': m.get('verified', False),
            'props': m.get('props', []),
            'uses': m.get('uses', []),
            'needs': m.get('needs', []),
            'note': m.get('note', ''),
            'scss': entry.get('scss') or '',
            'global': entry.get('global', False),
            'heading': next((s['example_heading'] for s in entry['signatures'].values() if s.get('example_heading')), ''),
            'shots': [s for s in shots if (OUT / s).exists()],
        }

    page_types = []
    for t in static['page_types']:
        type_id = page_type_id(t['pages'])
        page_types.append({
            'id': type_id,
            'label': page_type_label(type_id),
            'pages': sorted(t['pages'], key=lambda p: (p != type_id, p)),
            'structure': t['structure'],
            'variants': media_variants(t['pages'], t['structure'], static['pages']),
        })
    order = mapping.get('build_order') or []
    page_types.sort(key=lambda t: (order.index(t['id']) if t['id'] in order else len(order),
                                   t['id'] != 'index', t['id']))
    for t in page_types:
        for block in t['structure']:
            components[block].setdefault('page_types', [])
            if t['id'] not in components[block]['page_types']:
                components[block]['page_types'].append(t['id'])

    data = {
        'meta': {
            'date': date.today().isoformat(),
            'developer': dev,
            'project': mapping.get('project', ROOT.name),
            'source': static.get('source', ''),
            'pages': len(static['pages']),
            'index_note': static.get('index_note', ''),
        },
        'todo': mapping.get('drupal_todo', []),
        'pageTypes': page_types,
        'components': components,
        'drupal': drupal,
    }

    template = (HERE / 'report-template.html').read_text(encoding='utf-8')
    payload = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
    Path(args.out).write_text(template.replace('/*__DATA__*/null', payload), encoding='utf-8')
    print(f"{len(components)} components, {len(page_types)} page types -> {args.out}")


if __name__ == '__main__':
    main()
