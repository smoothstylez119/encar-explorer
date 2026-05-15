import { jsonError, jsonOk } from "@/lib/http";
import { cacheVehicleImagesBatch } from "@/lib/sync";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
      vehicleId?: number;
    };

    const result = await cacheVehicleImagesBatch({
      limit: body.limit,
      vehicleId: body.vehicleId,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : String(error));
  }
}
