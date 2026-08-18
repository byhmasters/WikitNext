import { json } from '@/lib/api/respond';
import { getPageMeta, listHistory, resolvePageId } from '@/lib/wikit/revisions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageId = await resolvePageId(id);
  if (pageId == null) return json({ error: 'page not found' }, 404);
  const [page, revisions] = await Promise.all([getPageMeta(pageId), listHistory(pageId)]);
  return json({ page, count: revisions.length, revisions });
}
