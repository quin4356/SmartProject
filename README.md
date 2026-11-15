# SmartProject

Persoonlijke kennisbibliotheek voor boeken en documentaires (Angular + Supabase).

## Structuur
- `frontend/` — Angular-app (`npm ci`, `npm start`, `npm test`, `npm run lint`)
- `supabase/migrations/` — databaseschema met RLS
- `supabase/functions/` — edge functions: `search-books`, `search-documentaries`, `delete-account`

## Supabase instellen
1. Koppel het project: `npx supabase link --project-ref <ref>`
2. Schema uitrollen: `npx supabase db push`
3. Secrets voor de zoekfuncties:
   ```bash
   npx supabase secrets set GOOGLE_BOOKS_API_KEY=<key> TMDB_API_KEY=<key>
   ```
4. Functions deployen: `npx supabase functions deploy search-books search-documentaries delete-account`
5. Zet `supabaseUrl` en `supabasePublishableKey` in `frontend/src/environments/`.
6. Google-login: schakel de provider in via het Supabase-dashboard (Authentication → Providers).

## Deploy
`cd frontend && npm run build` — output in `frontend/dist/`.
