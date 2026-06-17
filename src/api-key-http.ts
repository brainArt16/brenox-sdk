import { BrenoxError } from "./errors";

export type ApiKeyAuthStyle = "bearer" | "x-api-key";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface ApiKeyRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export interface ApiKeyHttpClientOptions {
  baseUrl: string;
  apiKey: string;
  fetch?: typeof fetch;
  authStyle?: ApiKeyAuthStyle;
}

export class ApiKeyHttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchFn: typeof fetch;
  private readonly authStyle: ApiKeyAuthStyle;

  constructor(options: ApiKeyHttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.authStyle = options.authStyle ?? "bearer";
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async request<T>(path: string, options: ApiKeyRequestOptions = {}): Promise<T> {
    const response = await this.rawRequest(path, options);

    if (!response.ok) {
      throw await BrenoxError.fromResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async rawRequest(
    path: string,
    options: ApiKeyRequestOptions = {},
  ): Promise<Response> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers = new Headers(options.headers);
    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.authStyle === "x-api-key") {
      headers.set("X-API-Key", this.apiKey);
    } else {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    if (options.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }

    return this.fetchFn(url, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }
}
