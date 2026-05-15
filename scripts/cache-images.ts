import { cacheVehicleImagesBatch } from "@/lib/sync";

function readIntArg(name: string, fallback?: number) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? Number(value.slice(prefix.length)) : fallback;
}

async function main() {
  const limit = readIntArg("limit", 100);
  const vehicleId = readIntArg("vehicleId");
  const result = await cacheVehicleImagesBatch({ limit, vehicleId });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
