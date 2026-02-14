const PORT = process.env.PORT ?? "3000";
try {
  const res = await fetch(`http://localhost:${PORT}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) process.exit(1);
  const body = await res.json();
  process.exit(body.status === "ok" ? 0 : 1);
} catch {
  process.exit(1);
}
