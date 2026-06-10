# AGENTS.md — Chasqui Admin

The **operator panel** for Chasqui: edit prompts, manage the FAQ knowledge base, toggle/configure tools, and inspect conversations. Part of the [`chasqui-stack`](https://github.com/chasqui-stack/chasqui) stack — read the parent's [`docs/ARCHITECTURE.md`](https://github.com/chasqui-stack/chasqui/blob/main/docs/ARCHITECTURE.md) first.

## ⚠️ Design

**Read [`DESIGN.md`](./DESIGN.md) (repo root) BEFORE writing any UI.** It is the design sheet (Sentry-inspired tokens: violet-midnight canvas `#150f23`, electric-lime accent `#c2ef4e`, Rubik / Monaco). Match its colors, typography, and component style.

## Stack

React 19 · TypeScript · Vite · TanStack Query · Tailwind CSS · shadcn/ui · react-i18next · `npm`.

## Key rules (see ARCHITECTURE)

- It's a **SPA** that talks **directly to the core REST API** (JWT). No BFF, no SSR, no server functions.
- **Admin-only login (§4).** End users never access the admin and never authenticate.
- Scope: editable prompts (`/prompt`) · FAQ/RAG manager (`/faq`) · tool enable/config (`/tools`) · conversation inspection (`/conversations`).
- **i18n HARD RULE: no hardcoded UI strings** — everything through `t()` (`react-i18next`, locales in `src/locales/{en,es}.json`). Adding a string = adding the key to BOTH locales (a vitest guard fails on key drift). Default locale via `VITE_DEFAULT_LOCALE`; the header switcher persists to `localStorage`.
- **Module settings render themselves**: `/tools` builds forms from each module's `config_schema()` JSON Schema via `src/components/tools/SchemaForm.tsx` (flat schemas: str/int/float/bool). A new core module needs ZERO admin changes.
- Data layer: TanStack Query hooks in `src/hooks/` (`useAgentConfig`, `useFaq`, `useContacts`); axios client with JWT refresh in `src/lib/api-client.ts`.

## Dev

Requires **Node ≥ 20.19** (Vite 8 / Vitest 4 / ESLint 10). An `.nvmrc` pins Node 22 LTS.

```bash
nvm use                       # picks Node 22 from .nvmrc
npm install && npm run dev    # http://localhost:5191
npm run build && npm run lint && npm test
```

## Planning

PRPs and the sprint plan live in the **parent repo** (`../PRPs`, `../docs`).

## Don't

- Add SSR / server functions (keep it a Vite SPA).
- Add end-user authentication.
- Write UI that ignores `DESIGN.md`.
