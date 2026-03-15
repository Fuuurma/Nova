// src/lib/mcp-client.ts
/**
 * MCP (Model Context Protocol) client for Nova.
 *
 * Communicates with the Nexus backend MCP endpoint via JSON-RPC 2.0.
 * Used for code improvement, analysis, and experiment tracking.
 */
import "server-only";
import { env } from "@/env";

// ── Types ─────────────────────────────────────────────────────────────

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    required?: string[];
    properties: Record<string, {
      type: string;
      description?: string;
      default?: unknown;
      enum?: string[];
    }>;
  };
}

export interface MCPToolResult {
  content: Array<{
    type: "text" | "image" | "resource";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JSONRPCResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// ── Error Class ───────────────────────────────────────────────────────

export class MCPClientError extends Error {
  code: number;
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "MCPClientError";
    this.code = code;
    this.data = data;
  }
}

// ── Core Client ───────────────────────────────────────────────────────

const MCP_URL = env.NEXUS_API_URL ?? "http://localhost:4000";
const MCP_ENDPOINT = `${MCP_URL}/api/mcp`;

let requestId = 0;

/**
 * Send a JSON-RPC 2.0 request to the MCP endpoint.
 */
async function mcpRequest<T>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> {
  const id = ++requestId;

  const request: JSONRPCRequest = {
    jsonrpc: "2.0",
    id,
    method,
    ...(params && { params }),
  };

  const response = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new MCPClientError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const data: JSONRPCResponse<T> = await response.json();

  if (data.error) {
    throw new MCPClientError(data.error.code, data.error.message, data.error.data);
  }

  return data.result as T;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * List available MCP tools.
 */
export async function listTools(): Promise<MCPTool[]> {
  const result = await mcpRequest<{ tools: MCPTool[] }>("tools/list", {});
  return result.tools;
}

/**
 * Call an MCP tool with arguments.
 */
export async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<MCPToolResult> {
  return mcpRequest<MCPToolResult>("tools/call", {
    name,
    arguments: args,
  });
}

// ── Tool-Specific APIs ────────────────────────────────────────────────

export interface ImproveCodeParams {
  code: string;
  benchmark: string;
  goal: "performance" | "quality" | "coverage" | "bugs" | "refactor";
  iterations?: number;
}

export interface QuickScanParams {
  code: string;
  goal: "performance" | "quality" | "coverage" | "bugs";
}

export interface Experiment {
  job_id: string;
  iterations?: Array<{
    iteration: number;
    changes: string;
    result: string;
    metrics?: Record<string, number>;
  }>;
  [key: string]: unknown;
}

/**
 * Improve code autonomously by running benchmarks and measuring results.
 */
export async function improveCode(params: ImproveCodeParams): Promise<MCPToolResult> {
  return callTool("improve_code", { ...params });
}

/**
 * One-shot code analysis with improvement suggestions.
 */
export async function quickScan(params: QuickScanParams): Promise<MCPToolResult> {
  return callTool("quick_scan", { ...params });
}

/**
 * Get experiment log for a job.
 */
export async function getExperiments(jobId: string): Promise<Experiment> {
  const result = await callTool("get_experiments", { job_id: jobId });
  // Parse the text content if present
  if (result.content?.[0]?.type === "text" && result.content[0].text) {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return { job_id: jobId, raw: result.content[0].text };
    }
  }
  return { job_id: jobId };
}

// ── Convenience Object ──────────────────────────────────────────────────

export const mcp = {
  listTools,
  callTool,
  improveCode,
  quickScan,
  getExperiments,
};