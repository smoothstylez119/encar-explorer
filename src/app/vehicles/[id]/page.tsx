import { notFound } from "next/navigation";
import { VehicleDetail } from "@/components/VehicleDetail";
import { ensureVehicleDetailAvailable } from "@/lib/sync";

export default async function VehicleDetailPage(props: PageProps<'/vehicles/[id]'>) {
  const { id } = await props.params;
  const vehicleId = Number(id);

  if (!Number.isFinite(vehicleId)) {
    notFound();
  }

  const vehicle = await ensureVehicleDetailAvailable(vehicleId);
  if (!vehicle) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <VehicleDetail vehicle={vehicle} />
    </main>
  );
}
