import { ingestTorontoZoning } from "../../../src/server/torontoZoningIngestion.js";

export const config = { maxDuration: 300 };

const headers = {
  "content-type": "application/json; charset=utf-8",
};

const env = () => (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const unauthorized = () => new Response(JSON.stringify({
  error: "unauthorized",
  message: "Set INGEST_API_TOKEN and call this endpoint with Authorization: Bearer <token>.",
}), { status: 401, headers });

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({
      error: "method_not_allowed",
      message: "Use POST to run Toronto zoning ingestion.",
    }), { status: 405, headers });
  }

  const token = env().INGEST_API_TOKEN;
  const suppliedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || suppliedToken !== token) return unauthorized();

  const url = new URL(request.url, "https://temporal.local");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const maxFeatures = Number(url.searchParams.get("maxFeatures"));

  try {
    const result = await ingestTorontoZoning({
      dryRun,
      maxFeatures: Number.isFinite(maxFeatures) && maxFeatures > 0 ? maxFeatures : undefined,
    });
    return new Response(JSON.stringify(result), { headers });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "toronto_zoning_ingestion_failed",
      message: error instanceof Error ? error.message : "Toronto zoning ingestion failed.",
    }), { status: 500, headers });
  }
}
