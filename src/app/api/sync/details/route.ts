import { jsonError, jsonOk } from "@/lib/http";
import { hydrateVehicleDetailsBatch } from "@/lib/sync";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
      force?: boolean;
    };

    const result = await hydrateVehicleDetailsBatch({
      limit: body.limit,
      force: body.force,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : String(error));
  }
}
