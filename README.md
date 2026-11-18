<div align="center">

<img src="./banner.svg" width="100%" alt="SmartProject" />

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1200&color=FF2E97&center=true&vCenter=true&width=620&lines=Track+what+you+read+and+watch;Angular+%C2%B7+Supabase+%C2%B7+TypeScript" alt="Typing intro" />

</div>

## About

SmartProject is a web app where I keep track of the books I read and the documentaries I watch. You search a title, the app fills in the cover, author and page count from Google Books or TMDB, and you move it from "to read" to "reading" to "done". Start and end dates are set for you when the status changes.

The interface is in Dutch. It's a personal project I build on the side.

## Features

- **Library**: separate lists for books and documentaries, with filters and categories
- **Search**: look up books through Google Books and documentaries through TMDB
- **Dashboard**: a yearly reading goal, books and pages per category, average rating
- **Calendar**: see what you finished and when
- **To-read list**: everything that is still waiting
- **Account**: sign in with Supabase Auth, delete your account and data yourself

## Tech stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=angular,ts,sass,materialui,supabase,postgres,deno&theme=light" alt="Tech stack" />
</p>

- Frontend: Angular 22 with Angular Material and signals
- Backend: Supabase (PostgreSQL with row level security, Auth, Edge Functions on Deno)
- External APIs: Google Books, TMDB

## Project structure

```
frontend/   Angular app (pages, core services, shared components)
supabase/   database migrations and Edge Functions
```

## Run it locally

You need Node.js.

```bash
cd frontend
npm install
npm start
```

The app runs on http://localhost:4200 and talks to the hosted Supabase project. Database changes live in `supabase/migrations`, the Edge Functions in `supabase/functions` (they need `GOOGLE_BOOKS_API_KEY` and `TMDB_API_KEY` as Supabase secrets).

<p align="center">
  <a href="https://github.com/quin4356"><img src="https://img.shields.io/badge/Made%20by-Quincy%20Cox-FF2E97?style=for-the-badge" alt="Made by Quincy Cox" /></a>
</p>

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
