const SENSITIVE_PATTERNS = [
  /failed to connect/i,
  /database=/i,
  /hostname resolving/i,
  /lookup .+ on .+:53/i,
  /server misbehaving/i,
  /connection refused/i,
  /dial tcp/i,
  /\bpq:/i,
  /\bpgx\b/i,
  /postgres/i,
  /\bsql:/i,
  /redis/i,
  /access denied for user/i,
  /password authentication failed/i,
  /no such host/i,
  /\.go:\d+/,
  /\/internal\//,
  /\buser=/i,
];

export const DEFAULT_CLIENT_ERROR_MESSAGE =
  "Something went wrong. Please try again later.";

export function isSensitiveClientMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function sanitizeClientMessage(
  message: string,
  fallback = DEFAULT_CLIENT_ERROR_MESSAGE
): string {
  return isSensitiveClientMessage(message) ? fallback : message;
}
