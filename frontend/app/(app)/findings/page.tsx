import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import type { Metadata } from 'next';

/**
 * Live view of the test findings: renders docs/alpina/nextjs-test-plan.md
 * from the repository on every request — the .md file is the single source
 * of truth, this page is just a window onto it. Nothing is copy-pasted.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Test findings',
  description: 'Live view of docs/alpina/nextjs-test-plan.md — what we tested in this lab and what we found.',
};

async function getFindingsHtml(): Promise<string> {
  // process.cwd() is the frontend directory in dev and in `npm start`.
  const filePath = path.join(process.cwd(), '..', 'docs', 'alpina', 'nextjs-test-plan.md');
  const markdown = await readFile(filePath, 'utf8');
  return marked.parse(markdown, { async: false });
}

export default async function FindingsPage() {
  let html: string;
  try {
    html = await getFindingsHtml();
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
  return (
    <main className="findings">
      <div className="container findings__notice">
        <p className="body-sm">
          Live view of <code>docs/alpina/nextjs-test-plan.md</code> — edit that file and
          reload this page. Every test page also carries its own badge (bottom right).
        </p>
      </div>
      {/* Content is our own repository file, not user input. */}
      <div className="findings__body" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
