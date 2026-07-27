# ToolHubSoloBot

A multi-tool Telegram bot. Ships with one working tool — a **backlink verifier**
(checks whether a specific page links to your site) — and is structured so you
can drop in more tools over time.

## How it's organized

```
src/
  index.js               ← bot entry point, wires everything together
  menu.js                ← registry of tools + the inline-keyboard menu
  tools/
    backlinkChecker.js    ← working: checks one page for a link to your site
    backlinkDiscovery.js  ← stub: full-domain backlink discovery (needs a paid API)
  utils/
    fetchPage.js           ← safe HTTP fetch (timeout, size cap, UA header)
    url.js                 ← URL validation/normalization
    session.js              ← simple in-memory per-user conversation state
```

### Adding a new tool later
1. Create `src/tools/yourTool.js` exporting `TOOL_ID` and a `start(ctx)` function
   (and `handleMessage(ctx, state)` if it needs multi-step input, following the
   pattern in `backlinkChecker.js`).
2. Register it in `src/menu.js`'s `TOOLS` array — one line.

That's it — it shows up in `/start` and `/menu` automatically.

## Local setup

```bash
npm install
cp .env.example .env
# edit .env and paste your bot token from @BotFather
npm start
```

### Getting a bot token
1. Open Telegram, message **@BotFather**
2. Send `/newbot`, follow the prompts, name it `ToolHubSoloBot` (or your handle)
3. BotFather gives you a token like `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Put it in `.env` as `BOT_TOKEN=...`

## Deploying: GitHub + Railway

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial ToolHubSoloBot scaffold"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
   (`.env` is already in `.gitignore` — your token won't be committed.)

2. **Create the Railway project**
   - Go to [railway.app](https://railway.app) → New Project → **Deploy from GitHub repo**
   - Select the repo you just pushed
   - Railway auto-detects Node.js via Nixpacks and uses `npm start` (also pinned in `railway.json`)

3. **Set the environment variable**
   - In the Railway project → **Variables** tab
   - Add `BOT_TOKEN` = your token from BotFather
   - (Leave `BACKLINK_API_KEY` unset until you wire up full discovery)

4. **Deploy**
   - Railway deploys automatically on push to `main`
   - Check the **Deployments → Logs** tab — you should see `ToolHubSoloBot is running (long polling).`

5. **Test it** — message your bot on Telegram, send `/start`.

### Notes on this deploy style
- The bot uses **long polling**, not webhooks — no public URL or web server needed,
  which keeps the Railway setup simple. If you later add webhook mode you'd need
  to expose a port and set a public domain in Railway.
- Railway sends `SIGTERM` on redeploys; `index.js` handles that for a clean shutdown.
- Session state is in-memory per instance — fine for one Railway service.
  If you ever scale to multiple instances, swap `utils/session.js` for Redis.

## Known limitation (by design, for now)

The backlink verifier only sees links present in the raw HTML. If a page injects
its links via JavaScript (client-side rendering), this won't catch them — that
would require a headless browser (e.g. Playwright), which is a heavier dependency
to add later if you need it.

The "Full Backlink Discovery" menu item is a stub — it explains that finding
*every* backlink to a domain needs a paid data provider (Ahrefs / Moz / SEMrush)
and points to where to wire in an API key when you're ready.
