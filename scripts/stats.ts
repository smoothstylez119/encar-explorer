import { getDashboardStats, getFilterOptions, getRecentSyncRuns } from "@/lib/db";

async function main() {
  console.log(
    JSON.stringify(
      {
        stats: getDashboardStats(),
        filters: getFilterOptions(),
        recentSyncRuns: getRecentSyncRuns(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
