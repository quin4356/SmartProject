const TMDB_URL = 'https://api.themoviedb.org/3/search/movie';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w185';
const DOCUMENTARY_GENRE_ID = 99;
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

  const { query } = await req.json().catch(() => ({ query: '' }));
  const q = typeof query === 'string' ? query.trim() : '';
  if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    return json({ error: 'Invalid query' }, 400);
  }

  const apiKey = Deno.env.get('TMDB_API_KEY');
  if (!apiKey) {
    return json({ error: 'TMDb is not configured' }, 500);
  }

  const params = new URLSearchParams({ api_key: apiKey, query: q, include_adult: 'false' });
  const response = await fetch(`${TMDB_URL}?${params}`);
  if (!response.ok) {
    return json({ error: 'TMDb request failed' }, 502);
  }

  const data = await response.json();
  const results = (data.results ?? [])
    .filter((item: any) => item.genre_ids?.includes(DOCUMENTARY_GENRE_ID))
    .slice(0, MAX_RESULTS)
    .map((item: any) => ({
      id: String(item.id),
      title: item.title ?? '',
      description: item.overview ?? '',
      coverUrl: item.poster_path ? `${TMDB_IMAGE_URL}${item.poster_path}` : '',
    }));
  return json(results);
});
