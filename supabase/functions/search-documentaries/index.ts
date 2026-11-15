const TMDB_URL = 'https://api.themoviedb.org/3/search/movie';
const TMDB_MOVIE_URL = 'https://api.themoviedb.org/3/movie';
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

async function findDirector(id: number, apiKey: string): Promise<string> {
  const params = new URLSearchParams({ api_key: apiKey });
  const response = await fetch(`${TMDB_MOVIE_URL}/${id}/credits?${params}`);
  if (!response.ok) {
    return '';
  }
  const data = await response.json();
  const directors = (data.crew ?? [])
    .filter((person: any) => person.job === 'Director')
    .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0));
  return [...new Set(directors.map((person: any) => person.name))].join(', ');
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
  const matches = (data.results ?? [])
    .filter((item: any) => item.genre_ids?.includes(DOCUMENTARY_GENRE_ID))
    .slice(0, MAX_RESULTS);
  const results = await Promise.all(
    matches.map(async (item: any) => ({
      id: String(item.id),
      title: item.title ?? '',
      creator: await findDirector(item.id, apiKey),
      description: item.overview ?? '',
      coverUrl: item.poster_path ? `${TMDB_IMAGE_URL}${item.poster_path}` : '',
    })),
  );
  return json(results);
});
