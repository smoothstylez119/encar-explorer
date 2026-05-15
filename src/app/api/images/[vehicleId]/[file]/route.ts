import fs from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/images/[vehicleId]/[file]'>,
) {
  const { vehicleId, file } = await ctx.params;
  const localPath = path.join(env.imageCacheDir, vehicleId, file);

  if (!fs.existsSync(localPath)) {
    return new Response("Image not found", { status: 404 });
  }

  const buffer = fs.readFileSync(localPath);
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
