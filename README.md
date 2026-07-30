# The Meeow Manor — Consent Form

Digital boarding intake & consent form. Saves to local MongoDB (`Meeow_Manor`) and applies **₹100 OFF** for first-time guests only.

## Collection

| Collection | Purpose |
|---|---|
| `consent_forms` | Full document: guardian, cat, intake, boarding, pricing, consent. First-time check by email/phone against existing forms. |

## Local run

```bash
npm run install:all
npm run dev:server
npm run dev:client
```

- UI: http://localhost:5173  
- API: http://localhost:5000  

Create `server/.env` (never commit this):

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/
CLIENT_ORIGIN=http://localhost:5173
```

Requires MongoDB running locally. Database name is set in code as `Meeow_Manor`.

## Deploy on Vercel (public link)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `Consentform`.
3. Set Environment Variable:
   - Name: `MONGODB_URI`
   - Value: `mongodb://localhost:27017/` (for local Mongo only; Vercel cloud cannot reach your PC localhost — use a reachable Mongo host if deploying publicly)
4. Optional: `CLIENT_ORIGIN` = your Vercel URL (or leave unset; API allows all origins when unset carefully — default in code uses `*`).
5. Deploy. Share the Vercel URL with everyone.

The form UI and `/api` run together on Vercel.
