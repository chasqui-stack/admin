# Chasqui Admin

React + Vite admin panel for [Chasqui](https://github.com/chasqui-stack/chasqui), the open-source stack for building WhatsApp AI agents.

The operator panel: edit agent prompts, manage the FAQ knowledge base (RAG), enable/configure tools, and inspect conversations. A SPA that talks directly to the [core](https://github.com/chasqui-stack/core) REST API. Admins only — end users never access it.

## Stack

React 19 · TypeScript · Vite · TanStack Query · Tailwind CSS · shadcn/ui.

## Local dev

```bash
cp .env.example .env     # set API URL (default http://localhost:8090)
npm install
npm run dev              # http://localhost:5191
```

## Design

UI follows [`DESIGN.md`](./DESIGN.md) (Sentry-inspired design sheet). Point your coding agent at it before building UI.

## Architecture

See the parent's [`docs/ARCHITECTURE.md`](https://github.com/chasqui-stack/chasqui/blob/main/docs/ARCHITECTURE.md).

## License

[Apache-2.0](./LICENSE).
