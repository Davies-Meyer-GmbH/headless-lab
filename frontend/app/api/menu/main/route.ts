import { getMainMenuItems } from '@/lib/main-menu';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getMainMenuItems());
}
