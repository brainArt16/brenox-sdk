import type { ApiKeyHttpClient } from "../../api-key-http";
import type {
  DeveloperUser,
  ProvisionUserInput,
} from "../../types/developer";

export class V1UsersResource {
  constructor(private readonly http: ApiKeyHttpClient) {}

  async provision(
    input: ProvisionUserInput,
    idempotencyKey?: string,
  ): Promise<DeveloperUser> {
    return this.http.request<DeveloperUser>("/v1/users", {
      method: "POST",
      body: input,
      idempotencyKey,
    });
  }
}
