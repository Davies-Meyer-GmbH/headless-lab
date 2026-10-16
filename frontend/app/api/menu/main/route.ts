import { getMainMenu } from '../../../../lib/main-menu';

export const dynamic = 'force-dynamic';

/** Fallback for isolated component previews outside the page provider. */
export async function GET(request: Request) {
  const language = new URL(request.url).searchParams.get('language') ?? '';
  if (language && !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language)) {
    return Response.json({ error: 'Invalid language.' }, { status: 400 });
  }
  try {
    return Response.json(await getMainMenu(language), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'Main navigation is unavailable.' }, { status: 502 });
  }
}
