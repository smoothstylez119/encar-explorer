import { jsonError, jsonOk } from "@/lib/http";
import { ensureVehicleDetailAvailable } from "@/lib/sync";

export async function GET(_request: Request, ctx: RouteContext<'/api/vehicles/[id]'>) {
  const { id } = await ctx.params;
  const vehicleId = Number(id);

  if (!Number.isFinite(vehicleId)) {
    return jsonError("Ungueltige Fahrzeug-ID.", 400);
  }

  const vehicle = await ensureVehicleDetailAvailable(vehicleId);
  if (!vehicle) {
    return jsonError("Fahrzeug nicht gefunden.", 404);
  }

  return jsonOk(vehicle);
}
