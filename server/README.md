# PropertyPulse — Backend (self-contained)

The API the mobile app consumes (Express + Supabase + Gemini + Stripe). It is a
copy of the PropertyPulse backend bundled **inside this repo** so the whole
project runs from one place — no separate web project required.

## Structure
```
server/
  apps/server/        Express API (routes, controllers, services, AI agents)
  packages/
    shared-types/     domain types (Property, Report, …) shared with the app
    shared-utils/     financial engine + formatters
    ai-core/          LLM / RAG contracts
  package.json        npm workspaces root
```

## Run
```bash
cd server
npm install        # first time only — links the workspace packages
npm run dev        # starts the API on http://localhost:4000  (tsx watch)
```

The mobile app talks to `http://<LAN-IP>:4000/api` (see `app.json` → `extra.apiUrl`,
currently `192.168.1.146`). The phone/emulator must be on the same Wi-Fi, and
port 4000 must be allowed through the firewall.

## Configuration — `apps/server/.env`
Secrets live here (gitignored). Already filled in:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` + `GEMINI_MODEL=gemini-flash-latest`
- `STRIPE_SECRET_KEY` (test mode)

> **AI note:** `GEMINI_MODEL` is `gemini-flash-latest`, not `gemini-2.0-flash`.
> The provided key has **0 free-tier quota** for `gemini-2.0-flash` (429
> RESOURCE_EXHAUSTED), which makes the AI Advisor `/chat` fail and the
> report/compare/negotiation endpoints silently fall back to deterministic math.
> `gemini-flash-latest` has working quota → real AI everywhere.

## Useful scripts
```bash
npm run import:properties --workspace apps/server   # load the listings dataset
npm run make:admin --workspace apps/server          # promote a user to admin
npm run ingest --workspace apps/server              # build the RAG knowledge base
```
