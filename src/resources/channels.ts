import type { HttpClient } from "../http";
import type {
  Channel,
  ChannelMembershipStatus,
  CreateChannelInput,
} from "../types/api";

export class ChannelsResource {
  constructor(private readonly http: HttpClient) {}

  async create(workspaceId: number, input: CreateChannelInput): Promise<Channel> {
    return this.http.request<Channel>(
      `/api/workspaces/${workspaceId}/channels`,
      {
        method: "POST",
        body: input,
      },
    );
  }

  async list(workspaceId: number): Promise<Channel[]> {
    return this.http.request<Channel[]>(
      `/api/workspaces/${workspaceId}/channels`,
    );
  }

  async join(
    workspaceId: number,
    channelId: number,
  ): Promise<ChannelMembershipStatus> {
    return this.http.request<ChannelMembershipStatus>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/join`,
      { method: "POST", body: {} },
    );
  }

  async leave(
    workspaceId: number,
    channelId: number,
  ): Promise<ChannelMembershipStatus> {
    return this.http.request<ChannelMembershipStatus>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/leave`,
      { method: "POST", body: {} },
    );
  }
}
