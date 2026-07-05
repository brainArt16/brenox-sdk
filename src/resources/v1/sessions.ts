import type { ApiKeyHttpClient } from "../../api-key-http";
import type {
  CreateSessionInput,
  DeveloperSession,
} from "../../types/developer";

export class V1SessionsResource {
  constructor(private readonly http: ApiKeyHttpClient) {}

  async create(
    input: CreateSessionInput,
    idempotencyKey?: string,
  ): Promise<DeveloperSession> {
    return this.http.request<DeveloperSession>("/v1/sessions", {
      method: "POST",
      body: input,
      idempotencyKey,
    });
  }
}
