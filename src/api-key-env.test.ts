import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertProductionApiKey,
  isLiveApiKey,
  isSandboxApiKey,
} from "./api-key-env";

describe("api-key-env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects sandbox and live key prefixes", () => {
    expect(isSandboxApiKey("bx_test_abc")).toBe(true);
    expect(isSandboxApiKey("bx_live_abc")).toBe(false);
    expect(isLiveApiKey("bx_live_abc")).toBe(true);
    expect(isLiveApiKey("bx_test_abc")).toBe(false);
  });

  it("allows sandbox keys outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => assertProductionApiKey("bx_test_secret")).not.toThrow();
  });

  it("rejects sandbox keys in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertProductionApiKey("bx_test_secret")).toThrow(
      /sandbox API keys/,
    );
    expect(() => assertProductionApiKey("bx_live_secret")).not.toThrow();
  });
});
