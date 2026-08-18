import { json } from '@/lib/api/respond';
import { getRendered, resolvePageId } from '@/lib/wikit/revisions';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageId = await resolvePageId(id);
  if (pageId == null) return json({ error: 'page not found' }, 404);
  const ordinal = Number(new URL(req.url).searchParams.get('ordinal'));
  const html = await getRendered(pageId, ordinal);
  return json({ page: { id: pageId }, ordinal, html });
}
