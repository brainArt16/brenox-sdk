import { describe, expect, it } from "vitest";
import {
  DEFAULT_CLIENT_ERROR_MESSAGE,
  isSensitiveClientMessage,
  sanitizeClientMessage,
} from "./client-message";

describe("client-message", () => {
  it("allows user-facing auth errors", () => {
    expect(isSensitiveClientMessage("invalid credentials")).toBe(false);
    expect(isSensitiveClientMessage("email already exists")).toBe(false);
  });

  it("blocks infrastructure errors", () => {
    const message =
      "failed to connect to `user=brenox_admin database=brenox_db`: hostname resolving error";
    expect(isSensitiveClientMessage(message)).toBe(true);
    expect(sanitizeClientMessage(message)).toBe(DEFAULT_CLIENT_ERROR_MESSAGE);
  });
});
