export function reportError(error: unknown, _context: Record<string, unknown> = {}) {
  // Simple console-based error reporting — no external telemetry
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("[EvSnap error]", message, error);
}
