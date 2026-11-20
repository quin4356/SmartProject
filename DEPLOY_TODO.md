# Todo: SmartProject live zetten

Opgesteld op 2026-11-20. 🔧 = in de code, 👤 = zelf doen in een dashboard of account.

## 1. Blokkerend: zonder dit niet live

### Code en branch
- [x] 🔧 **Bookcloth-redesign afgerond** (stap 1–6, branch `bookcloth-ontwerp`). Nog te controleren: de pagina's achter de login in de browser.
- [ ] 🔧 **PR naar `main`.** Daarna wachten tot de CI groen is.
- [ ] 🔧 **Niet-geteste checks alsnog draaien:**
  - `nginx -t` (alleen bij hosten via Docker);
  - `deno check` op de Edge Functions.

### Supabase (productie)
- [ ] 👤 **Migraties uitrollen:** `npx supabase db push`.
- [ ] 👤 **Alle drie de functies opnieuw deployen.** De zoekfuncties vragen nu om login.
  ```bash
  npx supabase functions deploy search-books search-documentaries delete-account
  ```
- [ ] 👤 **Secrets zetten:** `GOOGLE_BOOKS_API_KEY` en `TMDB_API_KEY`, en bij voorkeur ook `TMDB_READ_ACCESS_TOKEN`.
- [ ] 👤 **Auth → URL Configuration:**
  - de Site URL wordt het productiedomein;
  - het productiedomein komt bij de Redirect URLs.
- [ ] 👤 **E-mail-aanmelding uitzetten** (Auth → Providers → Email). Anders kan iedereen via de API een account met wachtwoord maken, buiten Google om.
- [ ] 👤 **Gebruikers- of storagelimiet vastleggen.** Eén pdf mag 50 MB zijn, er is geen limiet per gebruiker, en het gratis plan heeft 1 GB opslag in totaal.

### Google-login
- [ ] 👤 **OAuth consent screen op *In production* zetten.** Anders kunnen alleen de testgebruikers inloggen, maximaal 100.
- [ ] 👤 **Consent screen invullen:** app-naam, logo, URL's van de privacy- en voorwaardenpagina, en geautoriseerde domeinen.
- [ ] 👤 **Callback-URL controleren:** de Supabase-callback (`…supabase.co/auth/v1/callback`) moet bij de redirect-URI's staan.

### Hosting
- [ ] 👤 **Netlify koppelen** aan de repo, met een eigen domein en HTTPS.
- [ ] 🔧/👤 **Na de eerste deploy controleren:**
  - de headers, via securityheaders.com;
  - dat de CSP niets blokkeert tijdens inloggen, zoeken en een pdf openen.

### Privacy en juridisch (AVG)
- [ ] 🔧 **Privacyverklaring aanvullen:**
  - wie de verantwoordelijke is, met contactgegevens;
  - welke verwerkers er zijn (Supabase met regio, Netlify, Google, TMDB);
  - hoe lang gegevens bewaard worden;
  - dat je je gegevens kunt exporteren.
- [ ] 🔧 **Google Fonts zelf hosten.** Fonts van Google's CDN sturen het IP-adres van bezoekers naar Google; dat is een AVG-risico. Hosten vanaf de eigen site lost het op, en de CSP kan dan strenger.

### Eindtest
- [ ] 👤 **De browser-testprompt draaien** op de live-URL.
- [ ] 👤 **Met een tweede, nieuw Google-account testen:**
  - eerste login;
  - het lege dashboard;
  - een pdf uploaden;
  - het account verwijderen.

## 2. Belangrijk: kort na de lancering
- [ ] 🔧 **Jaardoel en huidige pagina naar Supabase verplaatsen.** Beide staan nu per browser in `localStorage` (`yearGoal`, `currentPage:<id>`). Hiervoor is een migratie nodig.
- [ ] 🔧 **Rate limit op de zoekfuncties**, per gebruiker en per minuut.
- [ ] 👤 **Kortere geldigheid voor het access-token**, bijvoorbeeld 15–30 minuten. Nu is het 1 uur.
- [ ] 👤 **Back-ups regelen:** het Pro-plan, of zelf periodiek een `pg_dump`.
- [ ] 👤 **Monitoring regelen:** een uptime-check en de Supabase-logs. Foutrapportage zoals Sentry is een nieuwe dependency, dus eerst beslissen.
- [ ] 🔧 **README bijwerken:** `TMDB_READ_ACCESS_TOKEN`, de deploystappen voor Netlify, en de domeinen voor OAuth en Supabase.
- [ ] 🔧 **Ongebruikte code opruimen:** `frontend/src/app/shared/tilt.ts`.
- [ ] 🔧 **Toegankelijkheid en mobiel controleren** met Lighthouse of axe, nadat de redesign af is.

## 3. Afwerking
- [ ] 🔧 **Eigen favicon en preview-tags:** Open Graph-tags voor deellinks.
- [ ] 🔧 **Vindbaarheid en installeren:** een `robots.txt`, en eventueel een web-manifest zodat de app te installeren is.
- [ ] 🔧 **Echte 404-pagina:** nu stuurt elke onbekende URL door naar het dashboard.
- [ ] **Nieuwe features**, top 3: importeren uit Goodreads of StoryGraph, de status "Niet uitgelezen", en een leesdagboek.

## Voorgestelde volgorde
1. Redesign afmaken of apart zetten.
2. De 🔧-punten uit blok 1: privacy, fonts, branch en PR.
3. De 👤-punten in Supabase, Google en Netlify.
4. De eindtest.
