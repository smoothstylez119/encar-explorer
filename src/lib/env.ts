import path from "node:path";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data");

export const env = {
  projectRoot,
  dataDir,
  imageCacheDir: path.join(dataDir, "images"),
  exportDir: path.join(dataDir, "exports"),
  dbPath: path.join(dataDir, "encar-explorer.sqlite"),
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  deepLApiKey: process.env.DEEPL_API_KEY ?? "",
  appBaseUrl: process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000",
  defaultPageSize: 40,
  imageCacheEnabled: process.env.ENCAR_CACHE_IMAGES !== "0",
};

export function hasExternalTranslator() {
  return Boolean(env.openAiApiKey || env.deepLApiKey);
}
