import type { HttpClient } from "../http";
import type {
  ApiKey,
  ApiKeyCreated,
  App,
  CreateApiKeyInput,
  CreateAppInput,
  CreateWebhookInput,
  Webhook,
} from "../types/apps";

export class AppsResource {
  constructor(private readonly http: HttpClient) {}

  async create(input: CreateAppInput): Promise<App> {
    return this.http.request<App>("/api/apps", {
      method: "POST",
      body: input,
    });
  }

  async list(): Promise<App[]> {
    const response = await this.http.request<{ apps: App[] }>("/api/apps");
    return response.apps;
  }

  async createKey(
    appId: number,
    input: CreateApiKeyInput = {},
  ): Promise<ApiKeyCreated> {
    return this.http.request<ApiKeyCreated>(`/api/apps/${appId}/keys`, {
      method: "POST",
      body: input,
    });
  }

  async listKeys(appId: number): Promise<ApiKey[]> {
    const response = await this.http.request<{ api_keys: ApiKey[] }>(
      `/api/apps/${appId}/keys`,
    );
    return response.api_keys;
  }

  async revokeKey(appId: number, keyId: number): Promise<void> {
    await this.http.request<{ revoked: boolean }>(
      `/api/apps/${appId}/keys/${keyId}`,
      { method: "DELETE" },
    );
  }

  async createWebhook(
    appId: number,
    input: CreateWebhookInput,
  ): Promise<Webhook> {
    return this.http.request<Webhook>(`/api/apps/${appId}/webhooks`, {
      method: "POST",
      body: input,
    });
  }
}
