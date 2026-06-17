import { BrenoxError } from "./errors";
import type { TokenStore } from "./token-store";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface HttpRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
  headers?: Record<string, string>;
}

export interface HttpClientOptions {
  baseUrl: string;
  tokenStore: TokenStore;
  fetch?: typeof fetch;
  onTokenRefreshed?: (token: string) => void;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenStore: TokenStore;
  private readonly fetchFn: typeof fetch;
  private readonly onTokenRefreshed?: (token: string) => void;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.tokenStore = options.tokenStore;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.onTokenRefreshed = options.onTokenRefreshed;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getToken(): Promise<string | null> {
    return this.tokenStore.getToken();
  }

  async setToken(token: string | null): Promise<void> {
    await this.tokenStore.setToken(token);
  }

  async request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const response = await this.rawRequest(path, options);

    if (response.status === 401 && options.auth !== false) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        const retry = await this.rawRequest(path, options);
        if (!retry.ok) {
          throw await BrenoxError.fromResponse(retry);
        }
        if (retry.status === 204) {
          return undefined as T;
        }
        return (await retry.json()) as T;
      }
    }

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
    options: HttpRequestOptions = {},
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

    if (options.auth !== false) {
      const token = await this.tokenStore.getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    return this.fetchFn(url, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }

  async refreshToken(): Promise<string | null> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<string | null> {
    const current = await this.tokenStore.getToken();
    if (!current) {
      return null;
    }

    const response = await this.fetchFn(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${current}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: current }),
    });

    if (!response.ok) {
      await this.tokenStore.setToken(null);
      return null;
    }

    const json = (await response.json()) as { token?: string };
    if (!json.token) {
      await this.tokenStore.setToken(null);
      return null;
    }

    await this.tokenStore.setToken(json.token);
    this.onTokenRefreshed?.(json.token);
    return json.token;
  }
}
