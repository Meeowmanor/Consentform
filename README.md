# The Meeow Manor — Consent Form

Digital boarding intake & consent form. Saves to MongoDB Atlas (`Meeow_Manor`) and applies **₹100 OFF** for first-time guests only.

## Collections

| Collection | Purpose |
|---|---|
| `owners` | Parent/guardian; first-time check by email/phone |
| `cats` | Cat profile |
| `consent_forms` | Full intake + boarding + pricing |

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
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/Meeow_Manor?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
```

## Deploy on Vercel (public link)

1. Push this repo to GitHub (done below).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `Consentform`.
3. Set Environment Variable:
   - Name: `MONGODB_URI`
   - Value: your Atlas connection string (with `/Meeow_Manor` in the path)
4. Optional: `CLIENT_ORIGIN` = your Vercel URL (or leave unset; API allows all origins when unset carefully — default in code uses `*`).
5. Deploy. Share the Vercel URL with everyone.

The form UI and `/api` run together on Vercel. Atlas stays always available in the cloud.
