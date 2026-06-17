import { HttpClient } from "./http";
import { AppsResource } from "./resources/apps";
import { AuthResource } from "./resources/auth";
import { CallsResource } from "./resources/calls";
import { ChannelsResource } from "./resources/channels";
import { MessagesResource } from "./resources/messages";
import { UsersResource } from "./resources/users";
import { WorkspacesResource } from "./resources/workspaces";
import { memoryTokenStore, type TokenStore } from "./token-store";
import { CallSignaling } from "./websocket/call-signaling";
import {
  ChannelConnection,
  type ChannelConnectionOptions,
  type ReconnectOptions,
  type SequenceStore,
} from "./websocket/channel";

export interface BrenoxClientOptions {
  /** API base URL, e.g. `http://localhost:8080` */
  baseUrl: string;
  /** Where to persist the JWT. Defaults to in-memory. */
  tokenStore?: TokenStore;
  /** Custom fetch implementation (tests, Node polyfills). */
  fetch?: typeof fetch;
  /** Called after a successful token refresh. */
  onTokenRefreshed?: (token: string) => void;
}

export type ChannelOptions = Omit<
  ChannelConnectionOptions,
  "workspaceId" | "channelId" | "http" | "messages"
>;

export class BrenoxClient {
  readonly auth: AuthResource;
  readonly workspaces: WorkspacesResource;
  readonly channels: ChannelsResource;
  readonly messages: MessagesResource;
  readonly users: UsersResource;
  readonly apps: AppsResource;
  readonly calls: CallsResource;

  private readonly http: HttpClient;

  constructor(options: BrenoxClientOptions) {
    this.http = new HttpClient({
      baseUrl: options.baseUrl,
      tokenStore: options.tokenStore ?? memoryTokenStore(),
      fetch: options.fetch,
      onTokenRefreshed: options.onTokenRefreshed,
    });

    this.auth = new AuthResource(this.http);
    this.workspaces = new WorkspacesResource(this.http);
    this.channels = new ChannelsResource(this.http);
    this.messages = new MessagesResource(this.http);
    this.users = new UsersResource(this.http);
    this.apps = new AppsResource(this.http);
    this.calls = new CallsResource(this.http);
  }

  /** Open a realtime connection to a channel (WebSocket). */
  channel(
    workspaceId: number,
    channelId: number,
    options: ChannelOptions = {},
  ): ChannelConnection {
    return new ChannelConnection({
      workspaceId,
      channelId,
      http: this.http,
      messages: this.messages,
      ...options,
    });
  }

  /** WebRTC signaling helper bound to a channel WebSocket + call REST APIs. */
  callSignaling(
    workspaceId: number,
    channelId: number,
    options: ChannelOptions = {},
  ): CallSignaling {
    return new CallSignaling(
      this.channel(workspaceId, channelId, options),
      this.calls,
      workspaceId,
      channelId,
    );
  }

  async getToken(): Promise<string | null> {
    return this.http.getToken();
  }

  async setToken(token: string | null): Promise<void> {
    return this.http.setToken(token);
  }
}

export type {
  ChannelConnectionOptions,
  ReconnectOptions,
  SequenceStore,
};
export { ChannelConnection, memorySequenceStore } from "./websocket/channel";
export { CallSignaling } from "./websocket/call-signaling";
