# AI Image Workflow Mini

A small node-based editor and backend graph runner. It covers frontend (Feature-Sliced Design), backend, a real image-generation API call, and DAG execution with parallel branches.

## Scenarios

1. **Generate:** Prompt -> Generate Image -> Result
2. **Edit:** Image Input + Prompt -> Edit Image -> Result
3. **Branch:** one Prompt -> Generate A / Generate B -> two Result nodes. Independent branches start at the same time.

## Run

```bash
cp .env.example .env
# in .env: XAI_API_KEY=...

npm install
npm run dev
```

- UI: http://localhost:5173
- API: http://localhost:3001

Without `XAI_API_KEY` the backend uses a mock image provider (SVG placeholders) so you can still exercise the graph and UI. A key is required for live generation.

```bash
npm test   # vitest: graph validation, parallel branches, retry
```

## Deploy on Railway

One service serves the API and the built UI. Secrets go into Railway Variables. `PORT` is set by Railway automatically.

### 1. Push the repo to GitHub

Railway deploys from GitHub. Commit this project and push it to a repository.

### 2. Create the project

1. Open [https://railway.com](https://railway.com) and sign in with GitHub.
2. **New Project** -> **Deploy from GitHub repo**.
3. Pick this repository.
4. Railway starts a Node build from the repo root (`npm install && npm run build`, then `npm start`).

### 3. Add the API key

1. Open the service -> **Variables**.
2. Add:

```
XAI_API_KEY=your_key_here
AI_BUDGET_USD=5
```

Optional:

```
XAI_IMAGE_MODEL=grok-imagine-image-2.0
AI_TIMEOUT_MS=60000
```

Do not put the key in the frontend or in git. After saving variables Railway redeploys.

Without `XAI_API_KEY` the demo still boots, but image nodes use the mock provider.

### 4. Public URL

1. Open the service -> **Settings** -> **Networking** -> **Generate Domain**.
2. You get a URL like `https://ai-image-workflow-production.up.railway.app`.
3. Open it: the editor and API are on the same origin (`/api`, `/runs`, `/references`).

Health check: `GET /api/health` should return `{ "ok": true, "provider": "xai" }` when the key is set.

### 5. What the deploy does

| Step | Command |
|---|---|
| Build | `npm install && npm run build` (Vite bundle in `frontend/dist`) |
| Start | `npm start` (Fastify on `PORT`, serves `frontend/dist` plus the API) |

Config is in `railway.toml`. Node 22 is expected (`engines` in the root `package.json`).

### Cost cap ($5)

Railway usage limits only cover **hosting**, not xAI image bills. Cap image spend in two places:

1. **xAI Console (hard wall).** Buy about $5 of prepaid credits. Keep invoiced billing at $0 and turn **auto top-up off**. When credits run out, the API rejects further calls.
2. **App budget.** `AI_BUDGET_USD=5` (default). Each live generate/edit is counted with a conservative estimate (~$0.05 generate, ~$0.08 edit / generate-with-references). After the cap, jobs fail with `Image budget reached` and no more xAI calls are made. Mock mode does not count.

`GET /api/health` includes `{ limitUsd, spentUsd, remainingUsd }`.

A Railway hard limit on the workspace (Usage -> Set Usage Limits) is still useful so the **container** cannot run past a few dollars. It will not stop xAI charges by itself.

### Notes

- Runs live in memory. A restart wipes job history.
- Uploaded images sit on the container disk and disappear after a redeploy.
- App spend is stored in `backend/data/spend.json`. A full Railway redeploy can reset that file; prepaid xAI credits remain the backstop.
- The free/hobby plan may sleep after idle time; the first request after sleep is slow.
- Generation can take up to 60s, so do not put this behind a 10s serverless timeout.

## Architecture

```
frontend/   Vite + React + TypeScript + xyflow, Feature-Sliced Design
backend/    Fastify + TypeScript, in-memory runs
shared/     graph types and port/DAG validation
```

Frontend FSD is pragmatic: canvas and node components do not own execution rules. Connections and run logic live in `entities` / `features`.

### Frontend layers

| Layer | Contents |
|---|---|
| `pages/workflow-editor` | Screen composition |
| `widgets` | Canvas, palette, preset bar, job panel |
| `features` | connect / typed ports, run + poll + retry, upload, scenarios |
| `entities` | graph store, node UI, run, preset |
| `shared` | api client, buttons, status badges |

### Graph execution

`POST /runs` (also `/api/runs`) -> `{ runId }`, then poll `GET /runs/:runId`.

The scheduler runs in waves: a node is queued when every inbound dependency is `success`. Ready AI jobs in the same wave start together via `Promise.all` (concurrency limit 4). Prompt, Image Input, and Result are passive and do not call the model.

Job states: `idle -> queued -> running -> success | error`.
Run states: `queued | running | completed | failed`.

`POST /runs/:runId/nodes/:nodeId/retry` resets the failed node and its descendants. Successful ancestors are not recomputed.

Ports are only `text` and `image`. Incompatible edges and cycles are blocked in the UI and on the backend.

## Preset and Request Builder

Preset is a data-model entity, not UI logic.

- type: `shared/preset.ts`
- catalog: `backend/src/domain/presets.ts`
- frontend: `entities/preset` (store + API + selectors)
- the UI only selects `presetId`; merging with the user prompt lives in `shared/request-builder.ts` and is applied on the backend when a run starts

There is one built-in preset, `Premium 3D` (`preset-demo`). There is no Preset Editor.

```
User Prompt  +  Selected Preset
                 |
                 ->
           Request Builder
             mainPrompt
             negativePrompt
             references
                 |
                 ->
           Generate Image API
```

Code: `shared/request-builder.ts`. The right-hand panel shows the built request before Run.

xAI Imagine has no native `negative_prompt` field, so the negative text is folded into the final `prompt`. When a preset is selected, Generate is sent as an image edit with reference images `/references/ref-1.jpg` and `ref-2.jpg` so style follows the references. Edit Image uses the connected image as the source; preset references are not mixed into that call.

## AI

The API key stays on the server. Adapter: `backend/src/ai/xai-imagine.ts`.

- Generate without references -> `POST https://api.x.ai/v1/images/generations`
- Generate with preset references / Edit Image -> `POST https://api.x.ai/v1/images/edits`
- Model: `grok-imagine-image-2.0`
- Timeout: 60s

To swap the image provider, change only `backend/src/ai/*`.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/runs` | Start a run -> `{ runId }` |
| GET | `/runs/:runId` | `queued / running / completed / failed` + jobs |
| POST | `/runs/:runId/nodes/:nodeId/retry` | Retry a failed node |
| GET | `/presets` | Preset catalog |
| GET | `/presets/:id` | One preset |
| POST | `/api/uploads` | Image Input upload |
| GET | `/api/health` | `xai` or `mock` |

The same run and preset routes are also available under `/api` for the Vite proxy.

## Out of scope

- Database, auth, multi-user
- SSE / WebSocket (polling is used)
- Preset Editor
- Undo / redo, minimap
- A custom canvas engine

## How to check parallelism

Load scenario **3. Branch**, then Run. In the Jobs panel both Generate nodes should be `running` at the same time. The unit test `runs independent generate nodes in the same wave` asserts `maxInFlight === 2`.
