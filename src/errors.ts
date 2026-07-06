import type { ApiErrorBody } from "./types/api";
import {
  DEFAULT_CLIENT_ERROR_MESSAGE,
  sanitizeClientMessage,
} from "./client-message";

export class BrenoxError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = "BrenoxError";
    this.status = status;
    this.body = body;
  }

  static async fromResponse(response: Response): Promise<BrenoxError> {
    let body: ApiErrorBody | undefined;

    try {
      const json = (await response.json()) as ApiErrorBody;
      if (typeof json?.error === "string") {
        body = {
          error: sanitizeClientMessage(json.error),
        };
      }
    } catch {
      // ignore non-JSON bodies
    }

    const message =
      body?.error ??
      sanitizeClientMessage(
        response.statusText || `HTTP ${response.status}`,
        response.status >= 500
          ? DEFAULT_CLIENT_ERROR_MESSAGE
          : `HTTP ${response.status}`
      );
    return new BrenoxError(message, response.status, body);
  }
}
