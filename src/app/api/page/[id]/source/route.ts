import { json } from '@/lib/api/respond';
import { getSource, resolvePageId } from '@/lib/wikit/revisions';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageId = await resolvePageId(id);
  if (pageId == null) return json({ error: 'page not found' }, 404);
  const raw = new URL(req.url).searchParams.get('ordinal');
  const ordinal = raw != null ? Number(raw) : null;
  const source = await getSource(pageId, ordinal);
  return json({ page: { id: pageId }, ordinal, source });
}
