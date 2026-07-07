export interface CreateAppInput {
  name: string;
  slug?: string;
}

export interface App {
  id: number;
  name: string;
  slug: string;
  workspace_id: number;
  sandbox_workspace_id?: number;
  owner_id: number;
  created_at: string;
}

export interface CreateApiKeyInput {
  name?: string;
  sandbox?: boolean;
}

export interface ApiKey {
  id: number;
  app_id: number;
  name: string;
  key_prefix: string;
  is_sandbox: boolean;
  created_at: string;
  revoked_at?: string;
  last_used_at?: string;
}

export interface ApiKeyCreated extends ApiKey {
  secret: string;
}

export interface CreateWebhookInput {
  url: string;
  events?: string[];
}

export interface Webhook {
  id: number;
  app_id: number;
  url: string;
  events: string[];
  created_at: string;
  secret?: string;
}
