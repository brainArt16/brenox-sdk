export type NotificationType =
  | "mention"
  | "reply"
  | "channel_invite"
  | "workspace_invite"
  | "call_invite";

export interface Notification {
  id: number;
  type: NotificationType | string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export interface ListNotificationsParams {
  limit?: number;
  offset?: number;
}

export interface MarkAllReadResult {
  marked_read: number;
}
