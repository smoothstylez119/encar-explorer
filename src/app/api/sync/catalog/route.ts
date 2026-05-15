import { jsonError, jsonOk } from "@/lib/http";
import { syncCatalogBatch } from "@/lib/sync";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      startPage?: number;
      maxPages?: number;
      pageSize?: number;
    };

    const result = await syncCatalogBatch({
      startPage: body.startPage,
      maxPages: body.maxPages,
      pageSize: body.pageSize,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : String(error));
  }
}
