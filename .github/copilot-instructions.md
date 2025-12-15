<!-- .github/copilot-instructions.md -->
# Copilot / AI Agent Instructions for ahlsell_log

This file contains concise, repository-specific guidance to help AI coding agents be productive immediately.

Overview
- This is a small React + TypeScript + Vite application using `@vitejs/plugin-react-swc`, Tailwind, and shadcn UI components.
- Primary purpose: a tiny UI for routing call notes (see `src/App.tsx`), built from shadcn components in `src/components/ui`.

Key files and folders
- `package.json`: scripts you can run: `dev` (`vite`), `build` (`tsc -b && vite build`), `preview` (`vite preview`), `lint` (`eslint .`).
- `vite.config.ts`: contains the Vite alias `@` → `src` and registers `@tailwindcss/vite` and `@vitejs/plugin-react-swc`.
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`: path alias `@/*` is configured — import paths use `@/...`.
- `components.json`: shadcn configuration and useful aliases (e.g., `ui` → `@/components/ui`, `lib` → `@/lib`).
- `src/components/ui/`: shadcn-generated UI components (e.g., `button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`). Prefer using these over reinventing controls.
- `src/lib/utils.ts`: `cn()` helper (clsx + tailwind-merge) — use it for className composition.
- `src/App.tsx`: contains the core routing logic and UI layout — examine for example patterns (FieldKey type, `routeInput`, `stripPrefix`, clipboard copy behaviour).

Project-specific patterns and conventions
- UI primitive usage: use shadcn components in `src/components/ui/*` as building blocks. They accept `className` and `ref` like standard React components.
- Class composition: prefer the exported `cn()` helper in `src/lib/utils.ts` to merge `clsx` and `tailwind-merge` behaviour.
- Aliases: always import internal modules using `@/` (e.g., `@/components/ui/button`, `@/lib/utils`) to match `tsconfig` and `vite` aliases.
- Component style: components follow shadcn conventions (variants, `className` override). Look at `components.json` for theme/style choices.
- No tests detected: there are no test runners configured. Avoid assuming Jest/RTL; if adding tests, update `package.json` and include simple `npm` scripts.

Behavioral and UI details worth noting (examples)
- Input routing (see `src/App.tsx`): typed prefixes map to fields. Example: `o123` routes to `order`, `a456` → `article`, `k789` → `customer`, `name` prefixes `n`, email detection uses `@`.
- Copy interaction: clicking the `Copy` button or pressing Space on a read-only input copies field value to clipboard (uses `navigator.clipboard.writeText`).
- Focus: main input is auto-focused with a ref in `App.tsx` during mount.

Build / run / lint
- Local dev (PowerShell):
```
yarn dev
```
or
```
npm run dev
```
- Build for production (runs `tsc -b` then `vite build`):
```
yarn build
```
- Preview production build:
```
yarn preview
```
- Linting (ESLint):
```
yarn lint
```

Notes for code changes and PRs
- Preserve the `@` alias imports and update `tsconfig`/`vite.config.ts` together if you change paths.
- Follow existing shadcn component patterns — prefer adding variants to shared UI components instead of duplicating markup.
- Keep `cn()` usage consistent for conditional class composition so Tailwind merging works correctly.

When modifying `src/App.tsx` routing logic
- Add unit tests (if you introduce complex routing) and keep `routeInput` and `stripPrefix` small and deterministic.
- Update comments and fixtures in `App.tsx` — the routing logic has an explicit `TODO` about test cases.

When adding dependencies
- Add to `package.json` and ensure dev dependencies (TypeScript versions) are compatible with existing `typescript` ~5.9.3.
- Run `yarn` (or `npm install`) and verify `yarn dev` still starts Vite without errors.

Missing or non-discoverable items
- There are no automated tests or CI configurations discoverable in the repo — ask maintainers where they expect CI and test runners to live before adding.

If unsure, check these files first
- `README.md`, `package.json`, `vite.config.ts`, `components.json`, `src/App.tsx`, `src/components/ui/*`, `src/lib/utils.ts`.

Questions for maintainers (ask in PR comments)
- Do you want unit tests added? If so, which runner (Vitest, Jest, etc.)?
- Are there style or commit conventions (prettier, commitlint) not tracked here?

End of instructions — request feedback if anything is unclear or missing.
