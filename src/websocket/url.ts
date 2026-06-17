export function httpToWebSocketBase(httpBase: string): string {
  const url = new URL(httpBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function buildChannelWebSocketUrl(
  httpBase: string,
  workspaceId: number,
  channelId: number,
  token: string,
): string {
  const wsBase = httpToWebSocketBase(httpBase);
  const url = new URL(`${wsBase}/api/ws`);
  url.searchParams.set("workspace_id", String(workspaceId));
  url.searchParams.set("channel_id", String(channelId));
  url.searchParams.set("token", token);
  return url.toString();
}
