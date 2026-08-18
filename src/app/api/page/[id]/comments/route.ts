import { json } from '@/lib/api/respond';
import { listComments, resolvePageId } from '@/lib/wikit/revisions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageId = await resolvePageId(id);
  if (pageId == null) return json({ error: 'page not found' }, 404);
  const comments = await listComments(pageId);
  return json({ page: { id: pageId }, count: comments.length, comments });
}
