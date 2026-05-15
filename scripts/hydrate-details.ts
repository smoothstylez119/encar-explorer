import { hydrateVehicleDetailsBatch } from "@/lib/sync";

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function readIntArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? Number(value.slice(prefix.length)) : fallback;
}

async function main() {
  const limit = readIntArg("limit", 25);
  const force = hasFlag("force");
  const result = await hydrateVehicleDetailsBatch({ limit, force });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
