import type { ApiKeyHttpClient } from "../../api-key-http";
import type {
  CreateDeveloperChannelInput,
  DeveloperChannel,
} from "../../types/developer";

export class V1ChannelsResource {
  constructor(private readonly http: ApiKeyHttpClient) {}

  async create(
    input: CreateDeveloperChannelInput,
    idempotencyKey?: string,
  ): Promise<DeveloperChannel> {
    return this.http.request<DeveloperChannel>("/v1/channels", {
      method: "POST",
      body: input,
      idempotencyKey,
    });
  }
}
