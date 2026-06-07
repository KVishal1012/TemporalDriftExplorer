import { ingestTorontoZoning } from "../../../src/server/torontoZoningIngestion.js";

export const config = { maxDuration: 300 };

type VercelRequest = {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};
type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

const headers = {
  "content-type": "application/json; charset=utf-8",
};

const env = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const sendJson = (response: VercelResponse, status: number, body: unknown) => {
  response.setHeader("content-type", headers["content-type"]);
  response.status(status).json(body);
};

const headerValue = (request: VercelRequest, name: string) => {
  const value = request.headers[name] ?? request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    sendJson(response, 405, {
      error: "method_not_allowed",
      message: "Use POST to run Toronto zoning ingestion.",
    });
    return;
  }

  const token = env().INGEST_API_TOKEN;
  const suppliedToken = headerValue(request, "authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || suppliedToken !== token) {
    sendJson(response, 401, {
      error: "unauthorized",
      message: "Set INGEST_API_TOKEN and call this endpoint with Authorization: Bearer <token>.",
    });
    return;
  }

  const url = new URL(request.url ?? "", "https://temporal.local");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const maxFeatures = Number(url.searchParams.get("maxFeatures"));

  try {
    const result = await ingestTorontoZoning({
      dryRun,
      maxFeatures: Number.isFinite(maxFeatures) && maxFeatures > 0 ? maxFeatures : undefined,
    });
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, {
      error: "toronto_zoning_ingestion_failed",
      message: error instanceof Error ? error.message : "Toronto zoning ingestion failed.",
    });
  }
}
