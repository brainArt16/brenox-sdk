import type { CallsResource } from "../resources/calls";
import type {
  CallJoinPayload,
  CallLeavePayload,
  CallSignalPayload,
  ChannelServerEventMap,
} from "../types/events";
import type { Call, CallMode } from "../types/calls";
import type { ChannelConnection } from "./channel";

export interface CallOfferInput {
  call_id: number;
  to_user_id: number;
  sdp: string;
}

export interface CallAnswerInput {
  call_id: number;
  to_user_id: number;
  sdp: string;
}

export interface CallIceInput {
  call_id: number;
  to_user_id: number;
  candidate: string;
}

/**
 * WebRTC signaling helper over a channel WebSocket + call REST endpoints.
 * Does not manage RTCPeerConnection — see Brenox WEBRTC_CLIENT.md.
 */
export class CallSignaling {
  constructor(
    private readonly connection: ChannelConnection,
    private readonly calls: CallsResource,
    private readonly workspaceId: number,
    private readonly channelId: number,
  ) {}

  get channel(): ChannelConnection {
    return this.connection;
  }

  async connect(): Promise<void> {
    return this.connection.connect();
  }

  disconnect(): void {
    this.connection.disconnect();
  }

  on<K extends keyof Pick<
    ChannelServerEventMap,
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
  >>(
    type: K,
    listener: (event: ChannelServerEventMap[K]) => void,
  ): () => void {
    return this.connection.on(type, listener);
  }

  async initiate(mode: CallMode = "voice"): Promise<Call> {
    return this.calls.initiate(this.workspaceId, this.channelId, { mode });
  }

  async join(callId: number): Promise<Call> {
    return this.calls.join(callId);
  }

  async leave(callId: number): Promise<Call> {
    return this.calls.leave(callId);
  }

  sendOffer(input: CallOfferInput): void {
    this.connection.send("call.offer", input);
  }

  sendAnswer(input: CallAnswerInput): void {
    this.connection.send("call.answer", input);
  }

  sendIce(input: CallIceInput): void {
    this.connection.send("call.ice", input);
  }

  videoOn(callId: number): void {
    this.connection.send("call.video.on", { call_id: callId });
  }

  videoOff(callId: number): void {
    this.connection.send("call.video.off", { call_id: callId });
  }

  screenStart(callId: number): void {
    this.connection.send("call.screen.start", { call_id: callId });
  }

  screenStop(callId: number): void {
    this.connection.send("call.screen.stop", { call_id: callId });
  }
}

export type {
  CallJoinPayload,
  CallLeavePayload,
  CallSignalPayload,
};
