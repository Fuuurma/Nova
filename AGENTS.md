# AGENTS.md — Coding Agent Guidelines for Mission Control

## Build & Development Commands

```bash
pnpm dev                    # Start Next.js dev server (localhost:3000)
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm typecheck              # Run TypeScript type checking
pnpm test                   # Run Vitest unit tests
pnpm test:watch             # Run Vitest in watch mode
pnpm test:ui                # Run Vitest with UI
pnpm test:e2e               # Run Playwright E2E tests
pnpm test:all               # Full quality gate: lint + typecheck + test + build + e2e
pnpm quality:gate           # Alias for test:all
```

### Running a Single Test
```bash
pnpm test src/lib/__tests__/auth.test.ts              # Run specific test file
pnpm test -- -t "safeCompare"                         # Run tests matching pattern
pnpm test:e2e --grep "login"                          # Run E2E tests matching pattern
pnpm test:e2e:openclaw:local                          # E2E against local OpenClaw
pnpm test:e2e:openclaw:gateway                        # E2E against gateway OpenClaw
```

## Code Style & Conventions

### TypeScript
- **Strict mode enabled** — no `any` unless absolutely necessary with justification
- **Target**: ES2017, **Module**: esnext, **Module Resolution**: bundler
- Use explicit return types for exported functions
- Prefer `interface` for public APIs, `type` for unions/intersections

### Imports
- Use `@/` alias for `src/` directory imports
- Group imports: React/Next.js → Libraries → Internal modules → Local components
- Sort imports alphabetically within groups
- Default exports only for React components with single main export

### Formatting
- **Indentation**: 2 spaces
- **Semicolons**: Always
- **Quotes**: Single quotes (template literals for interpolation)
- **Line length**: Wrap at ~120 chars
- Use `cn()` utility (clsx + tailwind-merge) for conditional classnames

### Naming Conventions
- **Files**: kebab-case for components (`header-bar.tsx`), camelCase for utilities (`utils.ts`)
- **Components**: PascalCase with descriptive names (`SessionDetailsPanel`)
- **Functions/Variables**: camelCase, verbs for functions (`getSession`, `handleClick`)
- **Constants**: UPPER_SNAKE_CASE for config/environment values
- **Types/Interfaces**: PascalCase, prefix with `I` avoided
- **Custom Hooks**: `use*` pattern (`useSmartPoll`, `useWebSocket`)

### React Conventions
- **Server Components by default** — add `'use client'` only for hooks/event handlers
- **Props**: Use `interface` for component props, inline simple ones
- **State**: Prefer Zustand store (`useMissionControl`) over local state for shared data
- **Effects**: Clean up subscriptions/intervals in useEffect return
- **Error Handling**: Wrap client components with `<ErrorBoundary>`

### Component Structure Example
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useMissionControl } from '@/store'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  isOpen: boolean
  onClose: () => void
}

export function MyPanel({ title, isOpen, onClose }: Props) {
  const { data } = useMissionControl()

  const handleClick = useCallback(() => {
    // Implementation
  }, [dependencies])

  return (
    <div className={cn('base-styles', isOpen && 'open-styles')}>
      {/* JSX */}
    </div>
  )
}
```

### Error Handling
- **API Routes**: Return `{ error: string, status: number }` pattern
- **Validation**: Use Zod schemas with descriptive error messages
- **Try/Catch**: Always handle Promise rejections, log with structured logging
- **User-facing**: Show friendly messages, log technical details separately
- Use `requireRole()` for authentication in API routes

### Logging
- Server: Use `pino` logger from `@/lib/logger`
- Client: Use `createClientLogger()` from `@/lib/client-logger`
- Log levels: error > warn > info > debug
- Include context: module name, operation, relevant IDs

### Database
- **SQLite** via `better-sqlite3` (sync API)
- Use parameterized queries only — never string interpolation
- Wrap DB calls in try/catch, return null for not-found
- Use transactions for multi-step operations

### Testing
- **Unit tests**: Vitest with jsdom environment
- **Test files**: `*.test.ts` or `*.test.tsx` in `src/lib/__tests__/` or alongside code
- **Setup**: `src/test/setup.ts` loads `@testing-library/jest-dom`
- **Mocks**: Use `vi.mock()` for dependencies, mock at module level
- **Pattern**: Arrange-Act-Assert, descriptive test names
- **Coverage**: Minimum 60% on `src/lib/**/*.ts`

### E2E Testing (Playwright)
- Tests in `tests/` directory
- Base URL: `http://127.0.0.1:3005` (test server)
- Timeout: 60s per test, 10s for expect assertions
- Run sequentially (workers: 1) to avoid state conflicts
- Use `E2E_BASE_URL` env var to override

### Environment Variables
- `AUTH_USER` / `AUTH_PASS` — Admin credentials (12+ char password)
- `API_KEY` — System API key for programmatic access
- `OPENCLAW_*` — Gateway connection settings
- `MC_*` — Rate limiting and workload throttling
- Access via `process.env.X` (Next.js runtime)

### Project Structure
```
src/
├── app/              # Next.js App Router (API routes)
├── components/       # React components
│   ├── layout/       # Navigation, header, banners
│   ├── panels/       # Feature panels (main UI)
│   └── ui/           # Reusable UI primitives
├── lib/              # Utilities, hooks, helpers
│   ├── __tests__/    # Unit tests for lib modules
│   └── *.test.ts     # Tests alongside code
├── store/            # Zustand state management
└── test/             # Test setup files
tests/                # Playwright E2E tests
.data/                # SQLite database (gitignored)
.next/                # Build output (gitignored)
```

### CSS & Styling
- **Tailwind CSS** with semantic design tokens
- Use `text-foreground`, `bg-card`, `border-border` etc. for theming
- `transition-smooth` for consistent animations
- Custom fonts: `font-mono-tight` for monospace elements
- Responsive: `hidden md:block` patterns for breakpoint changes

### API Routes
- Location: `src/app/api/*/route.ts`
- Always use `requireRole(request, 'role')` for auth
- Validate input with Zod schemas (`@/lib/validation`)
- Return `NextResponse.json()` with appropriate status codes
- Support both `x-api-key` header and `Authorization: Bearer`

### Git Workflow
- Feature branches from `main`
- Descriptive commit messages (present tense, imperative)
- Run `pnpm quality:gate` before push
- PRs against `main` with clear summary

### Known Patterns
- **Smart Polling**: `useSmartPoll()` hook for visibility-aware polling
- **WebSocket**: `useWebSocket()` for real-time updates
- **Navigation**: `useNavigateToPanel()` for panel routing
- **Session/Agent**: `sessionToAgent()` for data transformation
- **Normalization**: `normalizeModel()` for handling variant data shapes
