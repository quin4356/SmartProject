import { createClient } from 'npm:@supabase/supabase-js@2';

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

// Voorkeur: v4-leestoken in een header (komt niet in URL's of logs). Anders de v3-key.
function tmdbRequest(url: string, params: URLSearchParams): Promise<Response> {
  const token = Deno.env.get('TMDB_READ_ACCESS_TOKEN');
  if (token) {
    return fetch(`${url}?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  }
  params.set('api_key', Deno.env.get('TMDB_API_KEY')!);
  return fetch(`${url}?${params}`);
}

async function findDirector(id: number): Promise<string> {
  const response = await tmdbRequest(`${TMDB_MOVIE_URL}/${id}/credits`, new URLSearchParams());
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

  if (!Deno.env.get('TMDB_READ_ACCESS_TOKEN') && !Deno.env.get('TMDB_API_KEY')) {
    return json({ error: 'TMDb is not configured' }, 500);
  }

  const params = new URLSearchParams({ query: q, include_adult: 'false' });
  const response = await tmdbRequest(TMDB_URL, params);
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
      creator: await findDirector(item.id),
      description: item.overview ?? '',
      coverUrl: item.poster_path ? `${TMDB_IMAGE_URL}${item.poster_path}` : '',
    })),
  );
  return json(results);
});
