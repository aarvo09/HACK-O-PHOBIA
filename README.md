# AI Attendance Platform

Universities often struggle with attendance management at scale. Manual workflows are slow, error-prone, and do not support early intervention. This project automates the full attendance lifecycle with an AI-first pipeline and zero manual monitoring during operation: capture, analysis, risk detection, and communication.

## What This Platform Delivers

- Automated attendance monitoring and discrepancy detection
- Automated identification of students below 75% attendance
- Automated warning mail generation with student-specific context
- Live dashboard with Course -> Subject -> Class visibility
- Class-level analytics and history reporting for faster decisions

## Quick Start (2-5 Minutes)

1. Install dependencies

```bash
npm install
```

2. Create environment file

```bash
copy .env.example .env
```

3. Configure required values in `.env`

- Required: `DATABASE_URL`
- Optional (for AI email + forwarding flow): `GEMINI_API_KEY`, `GMAIL_USER`, `GMAIL_PASS`, `FORWARD_EMAIL`

4. Initialize database and seed sample data

```bash
npm run setup:demo
```

5. Run the app

```bash
npm run dev
```

Open: http://localhost:3000

## One-Command Verification

```bash
npm run judge:ready
```

This prepares Prisma artifacts and runs a production build.

## Judge Walkthrough (Recommended)

1. Open Dashboard `/` to show Course -> Subject -> Class hierarchy
2. Open a class card to show discrepancy analysis and roster `/classroom/[id]`
3. Open Camera Feed `/camera`, upload media, and run webhook intervals
4. Open Student Mail `/student-mail` to show auto-generated warning mails below 75%
5. Open History `/history` for trend-style reporting

## Gemini API Usage (Brief)

- Classroom intelligence: AI-assisted analysis pipeline for attendance discrepancy context
- Communication intelligence: AI-generated warning mail body content
- Intervention intelligence: lowest-attendance subject insight for student prioritization

## Useful Commands

```bash
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:seed
```

## Troubleshooting

- Prisma connection error
- Verify `DATABASE_URL` and PostgreSQL availability

- Empty dashboard
- Run `npm run db:seed`

- Camera webhook shows no session
- Seed database and refresh to repopulate sessions
