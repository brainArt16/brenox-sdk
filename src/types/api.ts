export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

export interface TokenResponse {
  token: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  created_at: string;
}

export interface WorkspaceListItem {
  id: number;
  name: string;
  slug: string;
  role: string;
  created_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

/** Channel JSON from the Go API (struct fields without json tags). */
export interface Channel {
  ID: number;
  Name: string;
  OwnerID: number;
  WorkspaceID: number;
  IsReadOnly: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface CreateChannelInput {
  name: string;
  is_read_only?: boolean;
}

export interface ChannelMembershipStatus {
  workspace_id: number;
  channel_id: number;
  user_id: number;
  status: "joined" | "left";
}

export interface Message {
  id: number;
  channel_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface MessageListItem extends Message {
  username: string;
}

export interface CreateMessageInput {
  content: string;
  reply_to_message_id?: number;
  attachments?: Array<{
    object_key: string;
    file_name: string;
    mime_type: string;
    size_bytes: number;
  }>;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface UpdateProfileInput {
  username: string;
}

export interface ApiErrorBody {
  error: string;
}

export interface ListMessagesParams {
  limit?: number;
  offset?: number;
}
