# AI Attendance Platform

Realtime classroom attendance monitoring with:
- live dashboard grouped by course and subject
- camera/agent page with face detection overlays
- attendance webhook using Gemini analysis
- class detail page with discrepancy and roster view

## Judge Quick Start (2-5 min)

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

3. Fill at least `DATABASE_URL` in `.env`.
4. For email demo (optional but recommended), set:
	- `GMAIL_USER`
	- `GMAIL_PASS`
	- `DEMO_FORWARD_EMAIL` (single inbox to receive all warnings during judging)

4. Prepare DB + seed demo data:

```bash
npm run setup:demo
```

5. Start app:

```bash
npm run dev
```

Open http://localhost:3000

## One-command verification

```bash
npm run judge:ready
```

This runs Prisma setup and a production build.

## Demo Flow for Judges (recommended)

1. Open dashboard (`/`) and show course -> subject -> class hierarchy.
2. Open any class card to show detailed discrepancy and roster (`/classroom/[id]`).
3. Open camera page (`/camera`), upload classroom media, and show face detection count.
4. Trigger webhook (Start/End interval) and show live response payload.
5. Open history page (`/history`) for report-style summary UI.

## Notes

- If `GEMINI_API_KEY` is missing, the app uses safe mock AI output so demo still works.
- If Gmail creds are missing, email warnings are skipped without breaking API flow.
- The warning email body is generated using the same `GEMINI_API_KEY` (with fallback template if unavailable).

## Useful Commands

```bash
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:seed
```

## Troubleshooting

- Prisma connection error:
	- Verify `DATABASE_URL` and that Postgres is running.
- Empty dashboard:
	- Run `npm run db:seed`.
- Camera webhook says no session:
	- Seed DB and refresh page to populate class sessions.
