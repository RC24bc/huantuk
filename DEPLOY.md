# Deploy Huantuk to huantuk.tech

End-to-end one-time setup. Follow once; subsequent pushes auto-deploy.

## 1 · Push the latest code

Already done if you're reading this in the repo. Verify:

```bash
cd ~/huantuk
git status
git log --oneline -5
```

If anything's uncommitted, commit + push to `RC24bc/huantuk` main first.

## 2 · Connect to Vercel

1. Go to <https://vercel.com/new>.
2. Sign in with the GitHub account that owns `RC24bc/huantuk` (your `RC24bc` account).
3. Click **Import** next to `RC24bc/huantuk`.
4. **Framework preset**: Next.js (auto-detected). Leave defaults.
5. **Environment variables** — add ONE:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic Console key (`sk-ant-…`). Get one at <https://console.anthropic.com/settings/keys>.
   - Scope: Production, Preview, Development (all three).
6. Click **Deploy**. First build takes ~2 minutes.

You'll get a default URL like `huantuk-rc24bc.vercel.app`. Test it works before adding the custom domain.

## 3 · Point huantuk.tech at Vercel

In the Vercel dashboard for the `huantuk` project:

1. **Settings → Domains → Add** → enter `huantuk.tech` → **Add**.
2. Vercel will display the DNS records you need to set at the **registrar where you bought huantuk.tech**. They will be either:

### Option A · You're using the registrar's nameservers

Add these two records at your registrar's DNS panel:

| Type    | Name | Value                  | TTL   |
|---------|------|------------------------|-------|
| `A`     | `@`  | `76.76.21.21`          | Auto  |
| `CNAME` | `www`| `cname.vercel-dns.com.`| Auto  |

### Option B · You moved nameservers to Vercel

Set the registrar's nameservers to:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Vercel will then handle all DNS automatically.

> Whichever option Vercel asks for is shown in the Domains tab — copy from there to be safe.

## 4 · Wait for SSL

Vercel auto-provisions a Let's Encrypt SSL certificate once DNS propagates (1 minute – 48 hours, usually <10 minutes). The domain card in Settings → Domains shows the status.

When it goes green, <https://huantuk.tech> serves the app.

## 5 · Test Drug Discovery live

1. Visit <https://huantuk.tech>.
2. Click **Load demo case**.
3. Wait for the differentials to populate (10–30 seconds — Opus 4.7 reasoning).
4. Scroll to **Personalized Drug Discovery** at the bottom.
5. Click each of the three buttons. With your API key set, the **MOCK-UP** banner should NOT appear — results say "Source: Opus 4.7 — …PhD agent".

If you see "MOCK-UP" still, the env var didn't take effect. Re-deploy from Vercel UI (Deployments → … → Redeploy).

## 6 · For private-data testing (uncle's case)

The repo's `.gitignore` blocks `files/` and `raw-files/` — uncle's real reports must NEVER be committed. To test on real data:

```bash
cd ~/huantuk
mkdir -p files
# copy uncle's PDFs into ./files/ (or any path under .gitignored dirs)
npm run dev
```

Then drop them through the dropzone on `localhost:3000`. They go to Anthropic's API for parsing (TLS in transit) but are not persisted server-side and not committed to git.

## What credentials I need from you to do more

If you'd like me to handle deploy + DNS automatically end-to-end:

| Task | I need |
|---|---|
| Push code | Already done — your GitHub access via `gh` CLI is set up |
| Vercel deploy via CLI | A Vercel access token from <https://vercel.com/account/tokens> — pass it as `VERCEL_TOKEN` in `~/minda/.env`, plus tell me which Vercel team/scope owns the project |
| DNS records | Tell me where huantuk.tech is registered (Cloudflare? Namecheap? GoDaddy? exabytes? Hostinger?). If Cloudflare, an API token with Zone:DNS:Edit on huantuk.tech is the minimum permission. |
| Anthropic API key | Already noted — you'll add via Vercel UI when you have one |

If you're happy doing the Vercel+DNS click-through yourself, sections 1–5 above are everything you need.
