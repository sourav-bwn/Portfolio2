# Portfolio2

Dynamic portfolio website with an Express backend and Supabase (database + storage). It ships a server-rendered admin dashboard (EJS) for managing portfolio content and certificate uploads, plus a static public front end.

## Requirements

- Node.js 18+
- A Supabase project (URL + keys) and a storage bucket for certificate uploads

## Setup

```bash
npm install
cp .env.example .env   # fill in Supabase credentials, JWT secret and admin login
npm run seed           # optional: seed the database (scripts/seed.js, scripts/schema.sql)
npm start              # serves on the PORT from .env (8743 in the example)
```

`npm run dev` runs the server with `node --watch` for local development.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the server (`server.js`) |
| `npm run dev` | Start with auto-reload |
| `npm run seed` | Seed the Supabase database |
| `npm test` | Offline tests (`node --test`) |

## Project structure

```
server.js            # Express app: routes, auth, uploads
supabase.js          # Supabase client setup
views/               # EJS templates (login + admin dashboard)
public/              # Static front end and uploaded files
scripts/             # schema.sql + seed.js
test/, tests/        # node --test suites (render-escaping + server)
```

Deployed on Vercel (`vercel.json`). The Supabase service role key and JWT secret stay server-side - never commit a real `.env`.
