import crypto from "node:crypto";

export const DEFAULT_PAYMENT4_MERCHANT_KEY = "6ee404fc1a6ff2bbaf0b197a3810cead";

function md5Lower(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex").toLowerCase();
}

function normalizeSignParams(
  params: Record<string, string | number | undefined | null>
): Record<string, string | number> {
  const normalized: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(params)) {
    if (key === "sign" || key === "key") {
      continue;
    }
    if (value === undefined || value === null || value === "") {
      continue;
    }
    normalized[key] = value;
  }

  return normalized;
}

export function sortPayment4Params(params: Record<string, string | number | undefined | null>): string {
  const normalized = normalizeSignParams(params);
  const sortedKeys = Object.keys(normalized).sort((a, b) => a.localeCompare(b));

  return sortedKeys.map((key) => `${key}=${normalized[key]}`).join("&");
}

export function generatePayment4Sign(
  params: Record<string, string | number | undefined | null>,
  merchantKey = DEFAULT_PAYMENT4_MERCHANT_KEY
): string {
  const sortedString = sortPayment4Params(params);
  const stringToSign = sortedString ? `${sortedString}&key=${merchantKey}` : `key=${merchantKey}`;
  return md5Lower(stringToSign);
}

export function verifyPayment4Sign(
  params: Record<string, string | number | undefined | null>,
  sign: string,
  merchantKey = DEFAULT_PAYMENT4_MERCHANT_KEY
): boolean {
  return generatePayment4Sign(params, merchantKey) === sign.toLowerCase();
}
