import { syncCatalogBatch } from "@/lib/sync";

function readIntArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? Number(value.slice(prefix.length)) : fallback;
}

async function main() {
  const startPage = readIntArg("startPage", 1);
  const maxPages = readIntArg("maxPages", 25);
  const pageSize = readIntArg("pageSize", 100);
  const result = await syncCatalogBatch({ startPage, maxPages, pageSize });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
