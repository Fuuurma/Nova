# Nova-Nexus Integration Plan

**Created:** 2026-03-12
**Status:** Planning

---

## Overview

**Nova** (Next.js 16 frontend) needs to talk to **Nexus** (Elixir/Phoenix API backend).

### Key Points

1. Nova handles auth (Better Auth) - users sign in via Nova
2. Nova proxies API requests to Nexus with session token
3. Nexus validates session and enforces BYOK + credits

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nova (Next.js 16)                            │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Better Auth │  │ API Client  │  │ Middleware  │             │
│  │ (sessions)  │  │ (to Nexus)  │  │ (rewrite)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  Port: 3000                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (session token in header)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Nexus (Phoenix API)                            │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Auth Plug   │  │ Authorize   │  │ API Routes  │             │
│  │ (session)   │  │ (BYOK)      │  │ (/api/v1/*) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  Port: 4000                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Session Token Flow

### How It Works

1. User signs in via Nova (Better Auth)
2. Better Auth creates session with token, stores in `sessions` table
3. Session token stored in cookie: `better-auth.session_token`
4. Nova reads cookie, sends token to Nexus in `Authorization: Bearer <token>`
5. Nexus validates session against `sessions` table (shared DB)
6. Nexus enforces BYOK + credits

### Session Table (Shared)

Both Nova and Nexus use the same `sessions` table in Neon Postgres:

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. API Request Flow

### From Nova to Nexus

```typescript
// Nova: src/lib/nexus.ts
import { cookies } from "next/headers";

export async function nexusFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(
    `${process.env.NEXUS_API_URL}${path}`,
    { ...options, headers }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Nexus error: ${error}`);
  }

  return response.json();
}
```

### Usage in Server Actions

```typescript
// Nova: src/app/actions/tasks.ts
"use server";

import { nexusFetch } from "@/lib/nexus";

export async function createTask(goal: string) {
  return nexusFetch<Task>("/api/v1/tasks", {
    method: "POST",
    body: JSON.stringify({ goal }),
  });
}

export async function getTasks() {
  return nexusFetch<Task[]>("/api/v1/tasks");
}
```

---

## 3. Development Setup

### Running Both Servers

**Option A: Separate terminals**

```bash
# Terminal 1: Nexus (Elixir)
cd /Users/sergi/Projects/aitlas-nexus
mix phx.server
# Runs on http://localhost:4000

# Terminal 2: Nova (Next.js)
cd /Users/sergi/Projects/aitlas-nova
pnpm dev
# Runs on http://localhost:3000
```

**Option B: Turbo/Concurrently**

```json
// aitlas-nova/package.json
{
  "scripts": {
    "dev:all": "concurrently \"pnpm dev\" \"cd ../aitlas-nexus && mix phx.server\""
  }
}
```

### Environment Variables

**Nova (.env.local):**
```bash
# Database (shared with Nexus)
DATABASE_URL=postgresql://...@ep-...eu-west-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://...@ep-...eu-west-2.aws.neon.tech/neondb?sslmode=require

# Auth
BETTER_AUTH_SECRET=DoZUZ2kPtjucwt5ivpfSfhH0XaIeq+axw8yxiDX0Fr8=
BETTER_AUTH_URL=http://localhost:3000

# Nexus API
NEXUS_API_URL=http://localhost:4000

# Internal (for server-to-server)
FURMA_INTERNAL_SECRET=1f6961fa81b7ba3220e0136ce9b3e84858256d0c0ac8d7ed
```

**Nexus (.env):**
```bash
# Database (shared with Nova)
DATABASE_URL=postgresql://...@ep-...-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://...@ep-...eu-west-2.aws.neon.tech/neondb?sslmode=require

# CORS (allow Nova)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Internal
FURMA_INTERNAL_SECRET=1f6961fa81b7ba3220e0136ce9b3e84858256d0c0ac8d7ed

# Encryption (for BYOK keys)
ENCRYPTION_KEY=b46cf97cd7e62b17165a6a9f71f1535d88f4e811191018cf7082f984657156b7
```

---

## 4. Next.js Config (Proxy API Routes)

### Option A: Rewrite (Simple)

```javascript
// next.config.mjs
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/nexus/:path*',
        destination: `${process.env.NEXUS_API_URL}/api/:path*`,
      },
    ];
  },
};
```

This proxies `/api/nexus/v1/tasks` → `http://localhost:4000/api/v1/tasks`

**But:** Doesn't add session token automatically. Need middleware.

### Option B: Middleware (Recommended)

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proxy /api/nexus/* to Nexus backend
  if (pathname.startsWith('/api/nexus/')) {
    const nexusPath = pathname.replace('/api/nexus', '/api');
    const sessionToken = request.cookies.get('better-auth.session_token')?.value;

    const headers = new Headers(request.headers);
    if (sessionToken) {
      headers.set('Authorization', `Bearer ${sessionToken}`);
    }

    return NextResponse.rewrite(
      new URL(nexusPath, process.env.NEXUS_API_URL),
      { headers }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/nexus/:path*'],
};
```

**Usage from client:**
```typescript
// Client component
fetch('/api/nexus/v1/tasks')  // Proxied to Nexus with session token
```

---

## 5. Production Setup

### Single Domain (Recommended)

Deploy both behind a reverse proxy (nginx/Caddy):

```
aitlas.xyz
├── /              → Nova (Next.js)
├── /api/*         → Nexus (Phoenix)
└── /_next/*       → Nova static assets
```

**nginx config:**
```nginx
server {
    listen 443 ssl;
    server_name aitlas.xyz;

    # Nova (Next.js)
    location / {
        proxy_pass http://nova:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Nexus API
    location /api/ {
        proxy_pass http://nexus:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Separate Domains

```
app.aitlas.xyz    → Nova
api.aitlas.xyz    → Nexus
```

Nova needs to configure CORS and API URL:

```bash
NEXUS_API_URL=https://api.aitlas.xyz
```

---

## 6. Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User visits Nova                                             │
│    GET https://aitlas.xyz/                                      │
│    → Redirects to /login if no session                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User signs in (Better Auth)                                  │
│    POST /api/auth/login                                         │
│    → Creates session in DB                                      │
│    → Sets cookie: better-auth.session_token                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. User creates task                                            │
│    POST /api/nexus/v1/tasks                                     │
│    → Middleware adds Authorization: Bearer <token>              │
│    → Proxy to Nexus: POST /api/v1/tasks                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Nexus validates session                                      │
│    Auth plug checks sessions table                              │
│    Authorize plug checks credits + BYOK                         │
│    → 401 if not authenticated                                   │
│    → 402 if no credits                                          │
│    → 403 if no API key                                          │
│    → 200 if all good                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Checklist

### Nova (Frontend)

- [ ] Add `NEXUS_API_URL` to `.env.local`
- [ ] Create `src/lib/nexus.ts` API client
- [ ] Add middleware for `/api/nexus/*` proxy
- [ ] Update server actions to use Nexus client
- [ ] Handle error responses (401, 402, 403)

### Nexus (Backend)

- [x] Session table exists (shared DB)
- [x] Auth plug validates session token
- [x] Authorize plug checks credits + BYOK
- [ ] Add CORS config for Nova origin
- [ ] Test session validation from Nova

### Shared

- [x] Both use same Neon database
- [x] Session table schema matches
- [ ] Session token format matches (Better Auth format)

---

## 8. Quick Start Commands

```bash
# 1. Start Nexus
cd /Users/sergi/Projects/aitlas-nexus
mix phx.server

# 2. Start Nova (in another terminal)
cd /Users/sergi/Projects/aitlas-nova
pnpm dev

# 3. Test connection
curl http://localhost:3000/api/nexus/v1/health
# Should proxy to Nexus and return {"status":"ok"}

# 4. Test auth
# Sign in via Nova UI, then:
curl http://localhost:3000/api/nexus/v1/me \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
# Should return user info
```

---

## 9. Error Handling

| Status | Error | Nova Action |
|--------|-------|-------------|
| 401 | `authentication_required` | Redirect to /login |
| 402 | `payment_required` | Show billing page |
| 403 | `api_key_required` | Show API key setup page |
| 429 | `rate_limited` | Show retry message |
| 500 | `server_error` | Show error toast |

---

## Next Steps

1. **Create `src/lib/nexus.ts` in Nova** - API client with session token
2. **Add middleware for proxy** - `/api/nexus/*` → Nexus
3. **Update Nexus CORS** - Allow `http://localhost:3000`
4. **Test end-to-end** - Sign in → Create task → See result

---

*Plan created 2026-03-12*