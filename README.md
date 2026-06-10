# Chasqui Admin

React + Vite admin panel for [Chasqui](https://github.com/chasqui-stack/chasqui), the open-source stack for building WhatsApp AI agents.

The operator panel: edit agent prompts, manage the FAQ knowledge base (RAG), enable/configure tools, and inspect conversations. A SPA that talks directly to the [core](https://github.com/chasqui-stack/core) REST API. Admins only — end users never access it.

## Stack

React 19 · TypeScript · Vite · TanStack Query · Tailwind CSS · shadcn/ui · react-i18next.

## Pages

| Route | What it does |
|---|---|
| `/` | Dashboard — section overview |
| `/prompt` | Edit the agent's system prompt (`agent_config`) — takes effect next turn, no redeploy |
| `/faq` | FAQ knowledge base: CRUD, re-embed all, retrieval preview with similarity scores |
| `/tools` | Tool registry: per-tool enable switches + module settings **auto-rendered from each module's `config_schema()`** JSON Schema (`SchemaForm`) |
| `/conversations` | Contacts → read-only chat timeline (inline images / playable audio via presigned URLs when the core has storage configured) + per-contact memories |

## Local dev

```bash
cp .env.example .env     # set API URL (default http://localhost:8090)
npm install
npm run dev              # http://localhost:5191
```

## i18n

The UI is fully bilingual (es/en) via `react-i18next` with JSON locales
(`src/locales/{en,es}.json` — the React analog of Rails' `config/locales/*.yml`).

- **HARD RULE: no hardcoded UI strings** — every user-visible literal goes
  through `t()`. A vitest guard enforces key parity between locales.
- Default locale: `VITE_DEFAULT_LOCALE` (.env); the header switcher persists
  the user's choice in `localStorage`.
- The backend stays English-only (see the parent's AGENTS.md i18n posture);
  the frontend translates.

## Design

UI follows [`DESIGN.md`](./DESIGN.md) (Sentry-inspired design sheet). Point your coding agent at it before building UI.

## Architecture

See the parent's [`docs/ARCHITECTURE.md`](https://github.com/chasqui-stack/chasqui/blob/main/docs/ARCHITECTURE.md).

## License

[Apache-2.0](./LICENSE).
