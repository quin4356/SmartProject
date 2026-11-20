import { createClient } from 'npm:@supabase/supabase-js@2';

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';
const MAX_RESULTS = 5;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Alleen aangemelde gebruikers mogen zoeken (beschermt het API-quotum).
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data: auth, error: authError } = await userClient.auth.getUser(token);
  if (authError || !auth.user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { query } = await req.json().catch(() => ({ query: '' }));
  const q = typeof query === 'string' ? query.trim() : '';
  if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    return json({ error: 'Invalid query' }, 400);
  }

  const params = new URLSearchParams({
    q,
    maxResults: String(MAX_RESULTS),
    printType: 'books',
    fields: 'items(id,volumeInfo(title,authors,description,categories,pageCount,imageLinks/thumbnail))',
  });
  const apiKey = Deno.env.get('GOOGLE_BOOKS_API_KEY');
  if (apiKey) {
    params.set('key', apiKey);
  }

  const response = await fetch(`${GOOGLE_BOOKS_URL}?${params}`);
  if (!response.ok) {
    return json({ error: 'Google Books request failed' }, 502);
  }

  const data = await response.json();
  const results = (data.items ?? []).map((item: any) => ({
    id: item.id,
    title: item.volumeInfo?.title ?? '',
    authors: item.volumeInfo?.authors ?? [],
    description: item.volumeInfo?.description ?? '',
    category: item.volumeInfo?.categories?.[0] ?? '',
    pageCount: item.volumeInfo?.pageCount ?? null,
    coverUrl: (item.volumeInfo?.imageLinks?.thumbnail ?? '').replace('http://', 'https://'),
  }));
  return json(results);
});
