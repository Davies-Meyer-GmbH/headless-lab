import { getReviews } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getReviews());
}
