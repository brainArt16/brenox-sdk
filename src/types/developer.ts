export interface ProvisionUserInput {
  external_id: string;
  email?: string;
  username?: string;
}

export interface DeveloperUser {
  id: number;
  external_id: string;
  email?: string;
  username?: string;
}

export interface CreateDeveloperChannelInput {
  name: string;
  is_read_only?: boolean;
}

export interface DeveloperChannel {
  id: number;
  name: string;
  workspace_id: number;
  is_read_only: boolean;
}

export interface SendDeveloperMessageInput {
  channel_id: number;
  content: string;
  user_id?: number;
  external_id?: string;
}

export interface DeveloperMessage {
  id: number;
  channel_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface DeveloperMessageListItem extends DeveloperMessage {
  username: string;
}

export interface ListDeveloperMessagesParams {
  channel_id: number;
  limit?: number;
  offset?: number;
}

export interface CreateSessionInput {
  external_id: string;
  channel_id?: number;
}

export interface DeveloperSession {
  token: string;
  workspace_id: number;
  environment: "live" | "sandbox";
  channel_id?: number;
  user: DeveloperUser;
}
