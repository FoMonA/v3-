import { cors } from "hono/cors";
import { config } from "../config";

export const corsMiddleware = cors({
  origin: config.corsOrigin,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
});
