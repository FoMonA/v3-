import type { WSContext } from "hono/ws";
import type { BroadcastEvent } from "../types";

const clients = new Set<WSContext>();

export function addClient(ws: WSContext) {
  clients.add(ws);
}

export function removeClient(ws: WSContext) {
  clients.delete(ws);
}

export function broadcast(event: BroadcastEvent) {
  const msg = JSON.stringify(event);
  for (const ws of clients) {
    try {
      ws.send(msg);
    } catch {
      clients.delete(ws);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
