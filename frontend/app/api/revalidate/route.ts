import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * A6: revalidation endpoint for Drupal to call on publish.
 *
 * Clears the cached content-API responses (tag 'canvas-page'). Drupal would
 * call this from a publish hook/event subscriber, e.g.:
 *
 *   GET/POST /api/revalidate?secret=<REVALIDATE_SECRET>
 *
 * Whole-tag granularity: one publish refreshes every cached page. Per-path
 * invalidation is possible later by keying the cache on the path and calling
 * revalidatePath, but Canvas publishes can affect any page that shares a
 * component or the page variant, so tag-level is the safer default.
 */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || url.searchParams.get('secret') !== secret) {
    return NextResponse.json({ revalidated: false, error: 'Invalid secret.' }, { status: 401 });
  }
  // A6 result: revalidateTag does NOT expire fetch-level data cache entries
  // on Next 16.2.12 (tried 'max' and 'default' profiles); revalidatePath
  // does. Drupal calls this per published page path:
  //   POST /api/revalidate?secret=<REVALIDATE_SECRET>&path=/alpina
  // For variant/global changes Drupal can pass each affected path, or one
  // call per known Canvas page.
  const path = url.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ revalidated: false, error: 'Missing path parameter.' }, { status: 400 });
  }
  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
