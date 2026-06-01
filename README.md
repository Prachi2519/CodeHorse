# CodeHorse

CodeHorse is an AI Code Reviewer and Engineering OS for GitHub analytics,
repository review workflows, and pull request intelligence.

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

For local AI review jobs, run Inngest in a second terminal:

```bash
npm run inngest
```

Production AI review jobs use Inngest Cloud. Set `INNGEST_EVENT_KEY` and
`INNGEST_SIGNING_KEY` in Vercel, then sync the deployed app URL:
`https://your-codehorse-domain.vercel.app/api/inngest`.

Open [http://localhost:3000](http://localhost:3000).

## Vercel Deployment

Before deploying, copy `.env.example` into Vercel environment variables and set
production values.

Required environment variables:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_BASE_URL`
- `BETTER_AUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_WEBHOOK_SECRET`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

Recommended optional variables:

- `PINECONE_API_KEY`
- `PINECONE_DB_API_KEY`
- `PINECONE_INDEX_NAME`
- `BETTER_AUTH_TRUSTED_ORIGINS`

GitHub OAuth app settings for production:

- Homepage URL: `https://your-codehorse-domain.vercel.app`
- Authorization callback URL:
  `https://your-codehorse-domain.vercel.app/api/auth/callback/github`

Use a separate GitHub OAuth app for local development with this callback:

- `http://localhost:3000/api/auth/callback/github`

Production deploy checklist:

```bash
npm install
npm run db:migrate:deploy
npm run vercel:check
```

`BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_BASE_URL` must not point to localhost in
Vercel. If GitHub redirects to `localhost:3000/api/auth/callback/github`, update
the production GitHub OAuth callback URL and the Vercel environment variables to
your deployed domain.
