# AI Image Workflow Mini

Небольшой node-based редактор и backend-раннер графа. Тестовое: frontend (FSD), backend, реальный image-generation API, выполнение DAG с параллельными ветками.

## Сценарии

1. **Generate** — Prompt → Generate Image → Result
2. **Edit** — Image Input + Prompt → Edit Image → Result
3. **Branch** — один Prompt → Generate A / Generate B → два Result. Независимые ветки стартуют одновременно.

## Запуск

```bash
cp .env.example .env
# в .env: XAI_API_KEY=...

npm install
npm run dev
```

- UI: http://localhost:5173
- API: http://localhost:3001

Без `XAI_API_KEY` backend поднимается с mock-провайдером (SVG-заглушки), чтобы можно было проверить граф и UI. Для живой генерации ключ обязателен.

```bash
npm test   # vitest: валидация графа, параллельные ветки, retry
```

## Архитектура

```
frontend/   Vite + React + TypeScript + xyflow, Feature-Sliced Design
backend/    Fastify + TypeScript, in-memory runs
shared/     типы графа и валидация портов/DAG
```

FSD на фронте прагматичный: canvas и ноды не содержат правил выполнения. Соединения и запуск живут в `entities` / `features`.

### Слои frontend

| Слой | Что внутри |
|---|---|
| `pages/workflow-editor` | Сборка экрана |
| `widgets` | Canvas, палитра, бар пресета, панель job |
| `features` | connect/typed ports, run+poll+retry, upload, сценарии |
| `entities` | graph store, node UI, run/preset |
| `shared` | api client, кнопки, статусы |

### Выполнение графа

`POST /runs` (и `/api/runs`) → `{ runId }`, затем polling `GET /runs/:runId`.

Планировщик идёт волнами: в очередь попадают ноды, у которых все входы `success`. Готовая пачка AI-job запускается через `Promise.all` (лимит 4). Prompt / Image Input / Result — пассивные, без вызова модели.

Состояния job: `idle → queued → running → success | error`.  
Состояния run: `queued | running | completed | failed`.

`POST /api/runs/:runId/nodes/:nodeId/retry` сбрасывает failed-ноду и её потомков, успешные предки не пересчитываются.

Порты только `text` и `image`. Несовместимые рёбра и циклы блокируются и в UI, и на backend.

## Preset и Request Builder

Preset — отдельная сущность data model, не логика UI.

- тип: `shared/preset.ts`
- каталог: `backend/src/domain/presets.ts`
- фронт: `entities/preset` (store + API + селекторы)
- UI только выбирает `presetId`; склейка с user prompt живёт в `shared/request-builder.ts` и применяется на backend при старте run

Один готовый набор `Premium 3D` (`preset-demo`). Preset Editor нет.

```
User Prompt  +  Selected Preset
                 │
                 ▼
           Request Builder
             mainPrompt
             negativePrompt
             references
                 │
                 ▼
           Generate Image API
```

Код: `shared/request-builder.ts`. Панель справа показывает собранный запрос до Run.

xAI Imagine не имеет отдельного `negative_prompt` — negative вшивается в итоговый `prompt`. Если пресет выбран, Generate идёт как image edit с reference-картинками `/references/ref-1.jpg` и `ref-2.jpg`, чтобы стиль опирался на референсы. Edit Image берёт connected image как source; preset-референсы туда не подмешиваются.

## AI

Ключ только на сервере. Адаптер: `backend/src/ai/xai-imagine.ts`.

- Generate без references → `POST https://api.x.ai/v1/images/generations`
- Generate с preset references / Edit Image → `POST https://api.x.ai/v1/images/edits`
- Модель: `grok-imagine-image-2.0`
- Таймаут: 60 с

Если выдадут другой image API, меняется только `backend/src/ai/*`.

## API

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/runs` | Старт run → `{ runId }` |
| GET | `/runs/:runId` | `queued / running / completed / failed` + jobs |
| POST | `/runs/:runId/nodes/:nodeId/retry` | Retry failed node |
| GET | `/presets` | Каталог пресетов |
| GET | `/presets/:id` | Один пресет |
| POST | `/api/uploads` | Загрузка Image Input |
| GET | `/api/health` | `xai` или `mock` |

Те же run/preset маршруты доступны с префиксом `/api` для Vite-прокси.

## Что сознательно не сделано

- База данных, auth, multi-user
- SSE/WebSocket (в ТЗ разрешён polling)
- Preset Editor
- Undo/redo, minimap
- Свой canvas engine

## Как проверить параллельность

Сценарий **3. Branch** → Run. В панели Jobs оба Generate должны оказаться в `running` одновременно. Юнит-тест `runs independent generate nodes in the same wave` проверяет, что `maxInFlight === 2`.
