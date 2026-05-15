import { getDashboardStats, getFilterOptions, getRecentSyncRuns } from "@/lib/db";
import { jsonOk } from "@/lib/http";

export async function GET() {
  return jsonOk({
    stats: getDashboardStats(),
    filters: getFilterOptions(),
    recentSyncRuns: getRecentSyncRuns(10),
  });
}
