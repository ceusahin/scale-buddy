# Scale Your Friends

A real-time multiplayer browser game. Create a lobby, invite friends with a 5-letter code, answer 10 questions by voting on who in the group fits best, and get AI-powered personality results.

## Architecture

- **Monolith**: Single Next.js project, single Node server, one database.
- **Stack**: Next.js (App Router), TypeScript, TailwindCSS, Framer Motion, Prisma, SQLite (default; optional PostgreSQL), Socket.io.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

Copy the example env and set your database URL and optional admin credentials (`.env` is in `.gitignore` and will not be committed):

```bash
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL`: Default is `file:./dev.db` (SQLite, no extra install). Optional: use PostgreSQL by setting `provider = "postgresql"` in `prisma/schema.prisma` and a connection string here.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Used for `/admin` login (optional; if unset, admin login will return 503).

### 3. Database

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

The seed creates sample categories, questions, and one "Mixed" mode. **You need at least 100 questions per category** for the game to pick 10 random questions per mode. Use the admin panel to add more or bulk-upload CSV (one question per line).

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Landing**: `/`
- **Create/join lobby**: `/lobby`, `/lobby/create`, `/lobby/join`
- **Lobby room**: after creating or joining (real-time player list; leader starts game)
- **Game**: 10 questions, vote on players; then **Results** with mock AI analysis
- **Admin**: `/admin` (login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`), then Categories, Questions, Modes, Dashboard

## Scripts

- `npm run dev` – Custom server (Next + Socket.io) with tsx
- `npm run build` – Next.js production build
- `npm run start` – Run production server (run `npm run build` first)
- `npm run db:push` – Push Prisma schema to DB
- `npm run db:seed` – Seed categories, sample questions, and one mode
- `npm run db:studio` – Open Prisma Studio

## Game flow

1. **Create lobby** → Get a 5-character code; share link or code.
2. **Others join** with code + nickname (no duplicate nicknames in same lobby).
3. **Leader** picks a game mode and starts (min 2 players).
4. **10 questions** – each shows one question; all players are answer options; everyone votes (self-vote allowed or not per mode).
5. **Results** – AI-generated personality summary and titles per player (mock by default; replace with OpenAI in `lib/ai-analysis.ts` when `OPENAI_API_KEY` is set).

## Admin panel

- **Categories**: CRUD; questions belong to categories.
- **Questions**: CRUD; bulk upload CSV (one question per line) per category.
- **Modes**: CRUD; assign categories to modes; toggle self-vote and timer.
- **Dashboard**: Total games, most popular mode, most voted questions/players.

## Security & validation

- Lobby code format validated (5 uppercase alphanumeric).
- Duplicate nicknames in same lobby prevented.
- Duplicate votes prevented; vote locked after submit.
- Inputs validated with Zod; admin routes require cookie auth.

## Future-ready

- Code is structured so it can be split into services later.
- React Native / Capacitor can wrap the same API and socket.
- Deploy on VPS or Vercel (custom server runs on Node; Socket.io works with a single process; for scale, add Redis adapter placeholder in `server/socket.ts`).

## License

MIT
