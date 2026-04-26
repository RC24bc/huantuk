# Huantuk · Deploy Notes

The app is **live** at:

- 🌐 **<https://huantuk.vercel.app>** (clean alias)
- 🌐 https://huantuk-8xktq8b1g-ecs-projects-e460d7b8.vercel.app (immutable production URL)

## Demo preset URLs (auto-load + auto-run, zero API spend)

These work without `ANTHROPIC_API_KEY` set, using deterministic fallbacks. Shareable on WhatsApp, Twitter, clinical groups:

| URL | What it shows |
|---|---|
| <https://huantuk.vercel.app/?case=aosd> | Adult-Onset Still's Disease pattern · Yamaguchi criteria scoring · IL-1 / IL-6 / JAK repurposing |
| <https://huantuk.vercel.app/?case=lupus-refractory> | Class IV lupus nephritis failing HCQ + MMF + cyclophosphamide · anifrolumab/belimumab/voclosporin |
| <https://huantuk.vercel.app/?case=igg4rd> | Multi-organ IgG4-RD · rituximab + inebilizumab (MITIGATE Phase 3) |
| <https://huantuk.vercel.app/?case=undifferentiated-ctd> | 4 years, 6 specialists, no diagnosis — the canonical Huantuk pain point |

## Adding ANTHROPIC_API_KEY for live Opus 4.7 reasoning

Without this, the deployed site uses deterministic fallbacks (still works, demo-quality). With it, every button does live Opus 4.7 reasoning on whatever case the user uploads.

1. Get a key at <https://console.anthropic.com/settings/keys> (sign in with the same account as claude.ai). New accounts get $5 free credit, enough for 15–50 case runs.
2. Open the Huantuk project on Vercel: <https://vercel.com/ecs-projects-e460d7b8/huantuk/settings/environment-variables>
3. Click **Add New** → Name: `ANTHROPIC_API_KEY` → Value: `sk-ant-…` → Environments: tick all three (Production, Preview, Development) → **Save**.
4. Trigger a redeploy: Deployments tab → latest deployment → **⋯ → Redeploy**.

Once redeployed, the `MOCK-UP` banners on Drug Discovery cards disappear — every button hits Opus 4.7 directly.

## Rebuilding from local edits

```bash
cd ~/huantuk
# edit code...
git add -A
git commit -m "your message"
git push origin main
# Vercel auto-deploys on push to main? -> No — repo isn't connected.
# To deploy:
export VERCEL_TOKEN=$(grep -E '^VERCEL_TOKEN=' ~/minda/.env | head -1 | cut -d'=' -f2-)
npx --yes vercel@latest --prod --yes --token=$VERCEL_TOKEN
```

(Or ask Botty in chat — Botty has the token and runs the deploy command for you.)

## Connecting GitHub for auto-deploys (optional, recommended)

Linking the repo means every `git push` to `main` auto-deploys. Right now it's manual.

1. Open <https://vercel.com/ecs-projects-e460d7b8/huantuk/settings/git>
2. Click **Connect Git Repository** → GitHub → select `RC24bc/huantuk`.
3. (You may need to install the Vercel GitHub App on the RC24bc account first — Vercel walks you through it.)
4. After connecting, every push to `main` triggers a new production deploy automatically.

## Domain

Production runs on the free Vercel domain `huantuk.vercel.app`. No custom domain configured.

## Local dev (uncle's PDFs / private data)

Real medical records are never committed (gitignored). To test on real PDFs:

```bash
cd ~/huantuk
mkdir -p files
# copy PDFs into ./files/
cp .env.example .env.local
# add ANTHROPIC_API_KEY=sk-ant-... to .env.local
npm install
npm run dev
```

Open <http://localhost:3000>, drop the PDFs through the dropzone. They go to Anthropic's API for parsing (TLS in transit) but are not persisted server-side and not committed to git.

## Project IDs (for ops)

- Vercel scope: `ecs-projects-e460d7b8`
- Vercel project: `huantuk`
- Project URL: <https://vercel.com/ecs-projects-e460d7b8/huantuk>
- Token: stored in `~/minda/.env` as `VERCEL_TOKEN` (mode 600, not in any git repo)
