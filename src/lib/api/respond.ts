export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2) + '\n', {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
