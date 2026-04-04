import crypto from "node:crypto";

export const DEFAULT_PAYMENT8_MERCHANT_KEY = "cbiledn772wiz4w26yu4pk5u9gw21yx9";

function sortParams(params: Record<string, string | number | undefined>): string {
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

function md5(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex").toUpperCase();
}

export function generatePayment8Sign(
  params: Record<string, string | number | undefined>,
  merchantKey = DEFAULT_PAYMENT8_MERCHANT_KEY
): string {
  const sortedString = sortParams(params);
  const stringToSign = `${sortedString}&key=${merchantKey}`;
  return md5(stringToSign);
}

export function verifyPayment8Sign(
  params: Record<string, string | number | undefined>,
  sign: string,
  merchantKey = DEFAULT_PAYMENT8_MERCHANT_KEY
): boolean {
  const expectedSign = generatePayment8Sign(params, merchantKey);
  return expectedSign === sign.toUpperCase();
}
