const LIVE_PREFIX = "bx_live_";
const TEST_PREFIX = "bx_test_";

export function isSandboxApiKey(apiKey: string): boolean {
  return apiKey.startsWith(TEST_PREFIX);
}

export function isLiveApiKey(apiKey: string): boolean {
  return apiKey.startsWith(LIVE_PREFIX);
}

export function assertProductionApiKey(apiKey: string): void {
  if (typeof process === "undefined") {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  if (isSandboxApiKey(apiKey)) {
    throw new Error(
      "BrenoxServer: sandbox API keys (bx_test_*) must not be used when NODE_ENV=production",
    );
  }
}
