import fs from "node:fs";
import { env } from "@/lib/env";

export function ensureDataDirs() {
  fs.mkdirSync(env.dataDir, { recursive: true });
  fs.mkdirSync(env.imageCacheDir, { recursive: true });
  fs.mkdirSync(env.exportDir, { recursive: true });
}
