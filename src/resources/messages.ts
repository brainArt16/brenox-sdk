import type { HttpClient } from "../http";
import type {
  CreateMessageInput,
  ListMessagesParams,
  Message,
  MessageListItem,
} from "../types/api";

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  async send(
    workspaceId: number,
    channelId: number,
    input: CreateMessageInput,
  ): Promise<Message> {
    return this.http.request<Message>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/messages`,
      {
        method: "POST",
        body: input,
      },
    );
  }

  async list(
    workspaceId: number,
    channelId: number,
    params: ListMessagesParams = {},
  ): Promise<MessageListItem[]> {
    const response = await this.http.request<{ messages: MessageListItem[] }>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/messages`,
      {
        query: {
          limit: params.limit,
          offset: params.offset,
        },
      },
    );
    return response.messages;
  }
}
