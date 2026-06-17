import type { Message } from "./api";

/** Standard server → client WebSocket envelope. */
export interface ServerEvent<TPayload = unknown> {
  type: string;
  workspace_id?: number;
  channel_id?: number;
  event_id?: string;
  sequence?: number;
  timestamp?: string;
  payload: TPayload;
}

export interface MessageNewPayload {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface MessageUpdatedPayload extends Message {
  attachments?: AttachmentPayload[];
}

export interface AttachmentPayload {
  id: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
}

export interface TypingPayload {
  user_id: number;
}

export interface PresenceUserPayload {
  user_id: number;
}

export interface PresenceStatusPayload {
  user_id: number;
  status: "online" | "away" | "offline";
  last_seen: string;
}

export interface MemberPayload {
  user_id: number;
}

export interface NotificationNewPayload {
  id: number;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface CallJoinPayload {
  call_id: number;
  user_id: number;
  status: string;
  mode?: "voice" | "video";
}

export interface CallLeavePayload {
  call_id: number;
  user_id: number;
}

export interface CallEndPayload {
  call_id: number;
}

export interface CallSignalPayload {
  call_id: number;
  from_user_id?: number;
  to_user_id?: number;
  sdp?: string;
  candidate?: string;
}

export interface ErrorPayload {
  message: string;
}

/** Server → client event names handled by channel connections. */
export type ChannelServerEventType =
  | "message.new"
  | "message.updated"
  | "typing.start"
  | "typing.stop"
  | "presence.online"
  | "presence.offline"
  | "presence.status"
  | "member.joined"
  | "member.left"
  | "notification.new"
  | "call.join"
  | "call.leave"
  | "call.end"
  | "call.offer"
  | "call.answer"
  | "call.ice"
  | "call.video.on"
  | "call.video.off"
  | "call.screen.start"
  | "call.screen.stop"
  | "call.speaker.changed"
  | "call.recording.start"
  | "call.recording.stop"
  | "call.preferences"
  | "error";

export interface ChannelServerEventMap {
  "message.new": ServerEvent<MessageNewPayload>;
  "message.updated": ServerEvent<MessageUpdatedPayload>;
  "typing.start": ServerEvent<TypingPayload>;
  "typing.stop": ServerEvent<TypingPayload>;
  "presence.online": ServerEvent<PresenceUserPayload>;
  "presence.offline": ServerEvent<PresenceUserPayload>;
  "presence.status": ServerEvent<PresenceStatusPayload>;
  "member.joined": ServerEvent<MemberPayload>;
  "member.left": ServerEvent<MemberPayload>;
  "notification.new": ServerEvent<NotificationNewPayload>;
  "call.join": ServerEvent<CallJoinPayload>;
  "call.leave": ServerEvent<CallLeavePayload>;
  "call.end": ServerEvent<CallEndPayload>;
  "call.offer": ServerEvent<CallSignalPayload>;
  "call.answer": ServerEvent<CallSignalPayload>;
  "call.ice": ServerEvent<CallSignalPayload>;
  "call.video.on": ServerEvent<CallSignalPayload>;
  "call.video.off": ServerEvent<CallSignalPayload>;
  "call.screen.start": ServerEvent<CallSignalPayload>;
  "call.screen.stop": ServerEvent<CallSignalPayload>;
  "call.speaker.changed": ServerEvent<CallSignalPayload>;
  "call.recording.start": ServerEvent<CallSignalPayload>;
  "call.recording.stop": ServerEvent<CallSignalPayload>;
  "call.preferences": ServerEvent<CallSignalPayload>;
  error: ServerEvent<ErrorPayload>;
}

/** Client → server outbound events. */
export type ClientOutboundEventType =
  | "message.send"
  | "typing.start"
  | "typing.stop"
  | "call.offer"
  | "call.answer"
  | "call.ice"
  | "call.video.on"
  | "call.video.off"
  | "call.screen.start"
  | "call.screen.stop"
  | "call.speaker.changed"
  | "call.recording.start"
  | "call.recording.stop"
  | "call.preferences";

export interface ClientOutboundEvent {
  type: ClientOutboundEventType;
  payload?: unknown;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";
