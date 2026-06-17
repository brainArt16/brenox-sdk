import type { HttpClient } from "../http";
import type { Call, InitiateCallInput } from "../types/calls";

export class CallsResource {
  constructor(private readonly http: HttpClient) {}

  async initiate(
    workspaceId: number,
    channelId: number,
    input: InitiateCallInput = {},
  ): Promise<Call> {
    return this.http.request<Call>(
      `/api/workspaces/${workspaceId}/channels/${channelId}/calls`,
      {
        method: "POST",
        body: input,
      },
    );
  }

  async join(callId: number): Promise<Call> {
    return this.http.request<Call>(`/api/calls/${callId}/join`, {
      method: "POST",
      body: {},
    });
  }

  async leave(callId: number): Promise<Call> {
    return this.http.request<Call>(`/api/calls/${callId}/leave`, {
      method: "POST",
      body: {},
    });
  }
}
