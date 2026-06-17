export type CallMode = "voice" | "video";
export type CallStatus = "ringing" | "active" | "ended";

export interface Call {
  id: number;
  channel_id: number;
  workspace_id: number;
  initiator_id: number;
  status: CallStatus;
  mode: CallMode;
  created_at: string;
  ended_at?: string;
}

export interface InitiateCallInput {
  mode?: CallMode;
}
