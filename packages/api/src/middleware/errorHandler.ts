import type { Context, Next } from "hono";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error("[error]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = (err as any).status ?? 500;
    return c.json({ error: message }, status);
  }
}
