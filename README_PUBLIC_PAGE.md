# anses-public-frontend

Public-facing certificate distribution UI for the Argentine Consulate
in Tel Aviv. Citizens enter their DNI and download their certificate
of survival. Companion to [`anses-public-api`](../anses-public-api).

## Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- No additional runtime dependencies

## Local development

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your backend.
# Default: http://localhost:8000

# 3. Make sure the backend is running locally
#    (see anses-public-api README — uvicorn + Cloud SQL Auth Proxy)

# 4. Run the dev server
npm run dev
```

Visit <http://localhost:3000>. You'll be redirected to `/certificados`.

## Project layout

```
src/
├── app/
│   ├── layout.tsx              Thin root shell, imports global CSS
│   ├── page.tsx                Redirects "/" → "/certificados"
│   ├── certificados/
│   │   └── page.tsx            The lookup page (locale + state owner)
│   └── globals.css             Tailwind 4 import + animations + reset
├── components/
│   ├── Header.tsx              Consulate-branded header (controlled locale)
│   ├── LanguageToggle.tsx      ES/EN pill toggle (controlled)
│   ├── DNIForm.tsx             Input + submit + live normalized preview
│   ├── CertificateCard.tsx     One per result, with download button
│   ├── EmptyState.tsx          "No certificates found" card
│   └── ErrorState.tsx          Generic error card
├── lib/
│   ├── api.ts                  Typed fetch wrapper (discriminated result)
│   ├── dni.ts                  Client-side DNI normalizer (preview only)
│   └── i18n.ts                 ES/EN dictionary + t() helper
└── types/
    └── api.ts                  Mirrors backend's PublicLookupResponse
```

## Design notes

- **Locale state** lives at the page level (`certificados/page.tsx`).
  No global context, no provider tree. Every consumer (Header,
  DNIForm, etc.) takes `locale: Locale` as a prop and is "dumb."
- **Lookup state** is a discriminated union (`idle | loading | success
  | empty | error`). Each render shows exactly one of {form-only,
  results, empty, error} — the union makes mutual exclusivity
  impossible to violate.
- **Live DNI preview** uses a client-side mirror of the backend's
  normalization logic (`lib/dni.ts`). The backend is still
  authoritative; this just gives the user instant feedback.
- **Brand color `#2c4264`** is kept as an arbitrary Tailwind value
  inline rather than a theme token. Matches the previous consulate
  project; one color, easy to grep.
- **i18n**: ~20 strings, two languages. A typed dictionary plus a
  `t()` function. No library — would be 30–50 KB for nothing.

## Production deployment

Phase 7 (deferred) — Vercel deployment with `NEXT_PUBLIC_API_URL`
pointing at the deployed `anses-api` Cloud Run service. CORS on the
backend must allow the production frontend origin.
