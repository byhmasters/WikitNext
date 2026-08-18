import { json } from '@/lib/api/respond';
import { getRating, listVoters, resolvePageId } from '@/lib/wikit/revisions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageId = await resolvePageId(id);
  if (pageId == null) return json({ error: 'page not found' }, 404);
  const [rating, voters] = await Promise.all([getRating(pageId), listVoters(pageId)]);
  return json({ page: { id: pageId }, ...rating, voters });
}
