import crypto from "node:crypto";

export function sortParams(params: Record<string, string | number | undefined>): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== "";
    })
    .sort((a, b) => a.localeCompare(b));

  const pairs: string[] = [];
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      pairs.push(`${key}=${value}`);
    }
  }

  return pairs.join("&");
}

export function generateSign(
  params: Record<string, string | number | undefined>,
  merchantKey: string
): string {
  const sortedString = sortParams(params);
  const stringToSign = `${sortedString}&key=${merchantKey}`;
  return md5(stringToSign).toUpperCase();
}

export function verifySign(
  params: Record<string, string | number | undefined>,
  sign: string,
  merchantKey: string
): boolean {
  const expectedSign = generateSign(params, merchantKey);
  return expectedSign === sign.toUpperCase();
}

function md5(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex").toUpperCase();
}

export const DEFAULT_MERCHANT_KEY = "OHeuY847UqsB2M8ul0bI2ZXTNwpFwcyt";
