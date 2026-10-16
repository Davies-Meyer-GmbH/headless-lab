import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import type { Metadata } from 'next';

/**
 * Live dashboard of the test findings. Parses docs/alpina/nextjs-test-plan.md
 * (the single source of truth) into a readable view: status summary, one
 * card per test page, collapsible details. Nothing is copy-pasted — edit
 * the .md file and this page reflects it on the next request.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Test findings',
  description: 'What we tested in this lab and what we found — live from the repository docs.',
};

type StatusKey = 'pass' | 'limited' | 'fail' | 'todo' | 'other';

type IndexRow = { url: string; name: string; status: string; conclusion: string };
type Section = { id: string; title: string; status: string; bodyHtml: string };
type PartBRow = { id: string; test: string; check: string };

const STATUS_COLORS: Record<StatusKey, { bg: string; fg: string; label: string }> = {
  pass: { bg: '#e6f4ea', fg: '#1e7e34', label: 'pass' },
  limited: { bg: '#fef3e2', fg: '#9a6700', label: 'works, with limits' },
  fail: { bg: '#fdecea', fg: '#c0392b', label: 'fail' },
  todo: { bg: '#eef0f2', fg: '#57606a', label: 'not tested yet' },
  other: { bg: '#eef0f2', fg: '#57606a', label: '—' },
};

const cells = (row: string): string[] =>
  row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

const statusKey = (status: string): StatusKey => {
  const s = status.trim().toLowerCase();
  if (s in STATUS_COLORS) return s as StatusKey;
  return 'other';
};

async function getParsed() {
  const filePath = path.join(process.cwd(), '..', 'docs', 'alpina', 'nextjs-test-plan.md');
  const raw = await readFile(filePath, 'utf8');
  const lines = raw.split('\n');

  let currentH2 = '';
  let currentH3: string | null = null;
  const indexRows: IndexRow[] = [];
  const partBRows: PartBRow[] = [];
  const sections: Section[] = [];
  const summary: Record<string, number> = {};
  let buffer: string[] = [];

  const flushSection = () => {
    if (!currentH3 || buffer.length === 0) return;
    const body = buffer.join('\n').trim();
    const statusMatch = body.match(/^Status:\s*(.+)$/m);
    const status = statusMatch ? statusMatch[1].trim() : 'todo';
    summary[statusKey(status)] = (summary[statusKey(status)] ?? 0) + 1;
    // Render the section body (steps/results) as HTML, minus the Status line.
    const rest = body.replace(/^Status:\s*.+$/m, '').trim();
    sections.push({
      id: currentH3.split('.')[0],
      title: currentH3.replace(/^[A-Z]\d+\.\s*/, ''),
      status,
      bodyHtml: marked.parse(rest, { async: false }),
    });
    buffer = [];
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushSection();
      currentH3 = null;
      currentH2 = line.slice(3).trim();
      continue;
    }
    if (line.startsWith('### ')) {
      flushSection();
      currentH3 = line.slice(4).trim();
      continue;
    }
    if (currentH2.startsWith('Test index') && line.startsWith('| http')) {
      const [url, name, status, conclusion] = cells(line);
      indexRows.push({ url, name, status, conclusion });
      continue;
    }
    if (currentH2.startsWith('Part B') && /^\| B\d/.test(line)) {
      const [id, test, check] = cells(line);
      partBRows.push({ id, test, check });
      continue;
    }
    if (currentH3) buffer.push(line);
  }
  flushSection();

  return { indexRows, sections, partBRows, summary };
}

function StatusChip({ status }: { status: string }) {
  const key = statusKey(status);
  const color = STATUS_COLORS[key];
  return (
    <span className="findings-chip" style={{ background: color.bg, color: color.fg }}>
      {color.label}
    </span>
  );
}

export default async function FindingsPage() {
  let data: Awaited<ReturnType<typeof getParsed>>;
  try {
    data = await getParsed();
  } catch (error) {
    return (
      <main className="findings" style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <h1>Test findings</h1>
        <p>
          Could not read <code>docs/alpina/nextjs-test-plan.md</code>:{' '}
          {error instanceof Error ? error.message : String(error)}
        </p>
      </main>
    );
  }

  const { indexRows, sections, partBRows, summary } = data;
  const done = (summary.pass ?? 0) + (summary.limited ?? 0);

  return (
    <main className="findings">
      <header className="findings-hero">
        <h1>What we tested — and what we found</h1>
        <p className="findings-hero__sub">
          Every test page in this lab, its result, and what we learned.
          This view is generated live from <code>docs/alpina/nextjs-test-plan.md</code> —
          the same file a future session or agent will read to continue the work.
        </p>
        <div className="findings-hero__counts">
          <span className="findings-chip" style={{ background: STATUS_COLORS.pass.bg, color: STATUS_COLORS.pass.fg }}>
            {summary.pass ?? 0} passed fully
          </span>
          <span className="findings-chip" style={{ background: STATUS_COLORS.limited.bg, color: STATUS_COLORS.limited.fg }}>
            {summary.limited ?? 0} work with limits
          </span>
          <span className="findings-chip" style={{ background: STATUS_COLORS.todo.bg, color: STATUS_COLORS.todo.fg }}>
            {sections.length - done} not tested yet
          </span>
        </div>
        <p className="findings-hero__hint body-sm">
          Every page below also carries a black “what is this?” pill (bottom right) with the
          same explanation, right where you are looking.
        </p>
      </header>

      <h2 className="findings-h2">Test pages at a glance</h2>
      <div className="findings-grid">
        {indexRows.map((row) => {
          // Referenced test ids ("A1 + A2 + A3") become chips, and the card
          // title is the first referenced test's own name.
          const ids = row.name.match(/[AB]\d+/g) ?? [];
          const title =
            sections.find((s) => s.id === ids[0])?.title ?? row.name;
          return (
            <article key={row.url + row.name} className="findings-card">
              <div className="findings-card__top">
                <StatusChip status={row.status} />
                {row.url.startsWith('http') && (
                  <a className="findings-card__link" href={row.url} target="_blank" rel="noreferrer">
                    {new URL(row.url).pathname} ↗
                  </a>
                )}
              </div>
              <h3>{title}</h3>
              {ids.length > 0 && (
                <p className="findings-card__ids">
                  {ids.map((id) => (
                    <span key={id} className="findings-card__id">
                      {id}
                    </span>
                  ))}
                </p>
              )}
              {/* Table cells come from our own repository file. */}
              <div dangerouslySetInnerHTML={{ __html: marked.parse(row.conclusion, { async: false }) }} />
            </article>
          );
        })}
      </div>

      <h2 className="findings-h2">Part A — Next.js behaviour, the details</h2>
      <p className="findings-h2sub">
        Same tests as the cards above, with the steps we ran and everything we observed.
      </p>
      {sections.map((section) => (
        <details key={section.id} className="findings-details">
          <summary>
            <span className="findings-details__id">{section.id}</span> {section.title}
            <span className="findings-details__status">
              <StatusChip status={section.status} />
            </span>
          </summary>
          <div className="findings-details__body" dangerouslySetInnerHTML={{ __html: section.bodyHtml }} />
        </details>
      ))}

      <h2 className="findings-h2">Part B — Drupal &amp; Canvas side</h2>
      <div className="findings-grid">
        {partBRows.map((row) => (
          <article key={row.id} className="findings-card">
            <h3>
              <span className="findings-card__id">{row.id}</span> {row.test}
            </h3>
            {/* Table cells come from our own repository file. */}
            <div dangerouslySetInnerHTML={{ __html: marked.parse(row.check, { async: false }) }} />
          </article>
        ))}
      </div>
    </main>
  );
}
