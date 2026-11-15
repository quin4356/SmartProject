import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'attachments';

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

  const url = Deno.env.get('SUPABASE_URL')!;
  const authHeader = req.headers.get('Authorization') ?? '';

  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const userId = data.user.id;

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Storage files do not cascade, so remove the user's PDFs first.
  const { data: files, error: listError } = await admin.storage.from(BUCKET).list(userId);
  if (listError) {
    return json({ error: 'Could not list files' }, 500);
  }
  if (files && files.length > 0) {
    const paths = files.map((file) => `${userId}/${file.name}`);
    const { error: removeError } = await admin.storage.from(BUCKET).remove(paths);
    if (removeError) {
      return json({ error: 'Could not remove files' }, 500);
    }
  }

  // All tables reference auth.users with on delete cascade.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return json({ error: 'Could not delete account' }, 500);
  }
  return json({ ok: true });
});
