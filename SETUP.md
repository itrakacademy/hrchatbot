# Fixing "I'm having trouble connecting right now" on Azure

That message means the widget's call to the Anthropic API failed — almost
always because the browser was calling `api.anthropic.com` directly with no
API key and no CORS allowance. Browsers block that by design. The fix is a
small backend proxy that holds the real API key and forwards requests.

This folder gives you that proxy as an **Azure Static Web Apps API
function** — the simplest option if your repo already deploys to Azure via
a GitHub Actions workflow (look for a file like
`.github/workflows/azure-static-web-apps-<something>.yml` in your repo; if
you have that, you're on Static Web Apps).

## 1. Add these files to your repo

Copy the `api/` folder from this package into the **root** of your GitHub
repo, alongside your `raka-hr-widget-demo.html` (or wherever your static
site lives). The structure should look like:

```
your-repo/
├── raka-hr-widget-demo.html   (or index.html, etc.)
├── api/
│   ├── host.json
│   ├── package.json
│   └── chat/
│       ├── function.json
│       └── index.js
```

Azure Static Web Apps auto-detects the `api/` folder and deploys it as a
Functions backend alongside your static site — no separate resource to
create.

> If your GitHub Actions workflow file specifies an `api_location` other
> than `api` (check `.github/workflows/azure-static-web-apps-*.yml` for a
> line like `api_location: "api"`), put the folder there instead.

## 2. Get an Anthropic API key

Create one at https://console.anthropic.com (Settings → API Keys) if you
don't already have one for this project.

## 3. Store the key as a secret Application Setting

**Do not** put the key in any file you commit to GitHub.

1. Go to the Azure Portal → your Static Web App resource.
2. Left menu → **Configuration**.
3. Under **Application settings**, click **+ Add**.
   - Name: `ANTHROPIC_API_KEY`
   - Value: your real key (starts with `sk-ant-...`)
4. **Save**.

## 4. Push and redeploy

Commit and push the `api/` folder. Your existing GitHub Actions workflow
will redeploy automatically (Static Web Apps builds both the site and the
API together).

## 5. Confirm the widget points at the proxy

`raka-hr-widget.html` already calls a **relative** path, `/api/chat`, not
`https://api.anthropic.com` directly — so once the API function is
deployed on the same Static Web App, it works automatically with no
further changes to the widget file.

## Troubleshooting

- **Still get the connection error** → Open browser DevTools → Network tab,
  click the chat, and look at the `/api/chat` request. A 404 means the API
  folder isn't deployed (check step 1 / `api_location`). A 500 with
  "missing ANTHROPIC_API_KEY" means step 3 wasn't saved or the app hasn't
  restarted since.
- **On plain Azure App Service (not Static Web Apps)** → the same
  `chat/index.js` logic works, but you'll deploy it as a standalone Azure
  Function App (or any small Node/Express server) instead, and may need to
  add CORS headers for your site's actual domain rather than `*`.
