import type { ApiKeyHttpClient } from "../../api-key-http";
import type {
  DeveloperMessage,
  DeveloperMessageListItem,
  ListDeveloperMessagesParams,
  SendDeveloperMessageInput,
} from "../../types/developer";

export class V1MessagesResource {
  constructor(private readonly http: ApiKeyHttpClient) {}

  async send(
    input: SendDeveloperMessageInput,
    idempotencyKey?: string,
  ): Promise<DeveloperMessage> {
    return this.http.request<DeveloperMessage>("/v1/messages", {
      method: "POST",
      body: input,
      idempotencyKey,
    });
  }

  async list(
    params: ListDeveloperMessagesParams,
  ): Promise<DeveloperMessageListItem[]> {
    const response = await this.http.request<{
      messages: DeveloperMessageListItem[];
    }>("/v1/messages", {
      query: {
        channel_id: params.channel_id,
        limit: params.limit,
        offset: params.offset,
      },
    });
    return response.messages;
  }
}
