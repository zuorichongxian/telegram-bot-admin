import crypto from "node:crypto";

export const DEFAULT_PAYMENT10_MERCHANT_KEY =
  "ab08ede2a8164d1885860399c8814d48";

function stringifySignValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function sortPayment10Params(params: Record<string, unknown>): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => stringifySignValue(params[key]) !== undefined)
    .sort((a, b) => a.localeCompare(b));

  const pairs: string[] = [];
  for (const key of sortedKeys) {
    const value = stringifySignValue(params[key]);
    if (value !== undefined) {
      pairs.push(`${key}=${value}`);
    }
  }

  return pairs.join("&");
}

function md5Lower(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex").toLowerCase();
}

export function generatePayment10Sign(
  params: Record<string, unknown>,
  merchantKey = DEFAULT_PAYMENT10_MERCHANT_KEY
): string {
  const sortedString = sortPayment10Params(params);
  const stringToSign = sortedString
    ? `${sortedString}&key=${merchantKey}`
    : `key=${merchantKey}`;
  return md5Lower(stringToSign);
}

export function verifyPayment10Sign(
  params: Record<string, unknown>,
  sign: string,
  merchantKey = DEFAULT_PAYMENT10_MERCHANT_KEY
): boolean {
  const expected = generatePayment10Sign(params, merchantKey);
  return expected === sign.toLowerCase();
}
