// src/lib/nexus.ts
/**
 * Nexus API client for Nova.
 *
 * Handles:
 * - Session token forwarding (from Better Auth cookie)
 * - Error handling (401, 402, 403, 429, 500)
 * - Type-safe API calls
 */
import "server-only";
import { cookies } from "next/headers";
import { env } from "@/env";

// ── Types ─────────────────────────────────────────────────────────────

export interface NexusError {
  error: string;
  message?: string;
  action?: string;
  providers?: string[];
}

export interface Task {
  id: string;
  user_id: string;
  agent_slug: string;
  goal: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  key_preview: string;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
}

export interface CreditBalance {
  balance: number;
  formatted: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  plan_tier: "free" | "pro" | "enterprise";
  credits: CreditBalance;
  subscription: {
    id: string;
    status: string;
    plan: { id: string; name: string; tier: string };
  } | null;
  has_api_keys: boolean;
}

// ── Error Classes ─────────────────────────────────────────────────────

export class NexusApiError extends Error {
  status: number;
  code: string;
  action?: string;
  providers?: string[];

  constructor(status: number, data: NexusError) {
    super(data.message || data.error);
    this.name = "NexusApiError";
    this.status = status;
    this.code = data.error;
    this.action = data.action;
    this.providers = data.providers;
  }
}

// ── Core Fetch Function ───────────────────────────────────────────────

const NEXUS_API_URL = env.NEXUS_API_URL ?? "http://localhost:4000";

type FetchOptions = RequestInit & {
  params?: Record<string, string>;
};

/**
 * Fetch from Nexus API with session token.
 * Automatically includes the Better Auth session token from cookies.
 */
export async function nexusFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(path, NEXUS_API_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // Get session token from cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("better-auth.session_token")?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  // Add session token if present
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers,
  });

  // Handle error responses
  if (!response.ok) {
    let errorData: NexusError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: "unknown_error", message: await response.text() };
    }
    throw new NexusApiError(response.status, errorData);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

/**
 * Fetch from Nexus API with internal service auth.
 * For server-to-server calls that bypass user auth.
 */
export async function nexusFetchInternal<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...init } = options;
  const url = new URL(path, NEXUS_API_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Furma-Internal": env.FURMA_INTERNAL_SECRET,
    ...(init.headers as Record<string, string>),
  };

  const response = await fetch(url.toString(), {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "unknown" }));
    throw new NexusApiError(response.status, errorData);
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ── Convenience Methods ───────────────────────────────────────────────

export const nexus = {
  /** GET request with session auth */
  get: <T>(path: string, params?: Record<string, string>) =>
    nexusFetch<T>(path, { method: "GET", params }),

  /** POST request with session auth */
  post: <T>(path: string, body: unknown) =>
    nexusFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** PUT request with session auth */
  put: <T>(path: string, body: unknown) =>
    nexusFetch<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  /** DELETE request with session auth */
  delete: <T>(path: string) =>
    nexusFetch<T>(path, { method: "DELETE" }),

  /** Internal GET (server-to-server) */
  internal: {
    get: <T>(path: string, params?: Record<string, string>) =>
      nexusFetchInternal<T>(path, { method: "GET", params }),

    post: <T>(path: string, body: unknown) =>
      nexusFetchInternal<T>(path, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
};

// ── Domain APIs ───────────────────────────────────────────────────────

/** Tasks API */
export const tasksApi = {
  list: () => nexus.get<{ data: Task[] }>("/api/v1/tasks"),
  get: (id: string) => nexus.get<{ data: Task }>(`/api/v1/tasks/${id}`),
  create: (data: {
    goal: string;
    agent_slug?: string;
    context?: string;
  }) => nexus.post<{ data: Task }>("/api/v1/tasks", data),
  delete: (id: string) => nexus.delete<{ data: { deleted: boolean } }>(`/api/v1/tasks/${id}`),
};

/** API Keys API */
export const apiKeysApi = {
  list: () => nexus.get<{ data: ApiKey[] }>("/api/v1/api-keys"),
  providers: () => nexus.get<{ data: { id: string; name: string; key_prefix: string | null }[] }>("/api/v1/api-keys/providers"),
  create: (provider: string, key: string) =>
    nexus.post<{ data: ApiKey }>("/api/v1/api-keys", { provider, key }),
  delete: (id: string) => nexus.delete<{ data: { deleted: boolean } }>(`/api/v1/api-keys/${id}`),
};

/** Credits API */
export const creditsApi = {
  balance: () => nexus.get<{ data: CreditBalance }>("/api/v1/credits"),
  history: (limit = 20, offset = 0) =>
    nexus.get<{ data: { id: string; amount: number; balance: number; reason: string }[] }>(
      "/api/v1/credits/history",
      { limit: String(limit), offset: String(offset) }
    ),
};

/** User API */
export const userApi = {
  me: () => nexus.get<{ data: UserProfile }>("/api/v1/me"),
  update: (data: { name?: string; image?: string }) =>
    nexus.put<{ data: UserProfile }>("/api/v1/me", data),
};