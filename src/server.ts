import { ApiKeyHttpClient, type ApiKeyAuthStyle } from "./api-key-http";
import { V1ChannelsResource } from "./resources/v1/channels";
import { V1MessagesResource } from "./resources/v1/messages";
import { V1UsersResource } from "./resources/v1/users";

export interface BrenoxServerOptions {
  /** API base URL, e.g. `http://localhost:8080` */
  baseUrl: string;
  /** API key (`bx_live_...` or `bx_test_...`) */
  apiKey: string;
  fetch?: typeof fetch;
  /** How to send the API key. Default: `bearer` (`Authorization: Bearer …`) */
  authStyle?: ApiKeyAuthStyle;
}

export class BrenoxServer {
  readonly users: V1UsersResource;
  readonly channels: V1ChannelsResource;
  readonly messages: V1MessagesResource;

  private readonly http: ApiKeyHttpClient;

  constructor(options: BrenoxServerOptions) {
    this.http = new ApiKeyHttpClient({
      baseUrl: options.baseUrl,
      apiKey: options.apiKey,
      fetch: options.fetch,
      authStyle: options.authStyle,
    });

    this.users = new V1UsersResource(this.http);
    this.channels = new V1ChannelsResource(this.http);
    this.messages = new V1MessagesResource(this.http);
  }
}
