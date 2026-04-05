import crypto from "node:crypto";

export const DEFAULT_PAYMENT9_CLIENT_SECRET = "a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218";

function sortParams(params: Record<string, string | number | undefined>): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== "";
    })
    .sort((a, b) => a.localeCompare(b));

  let result = "";
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      result += `${key}${value}`;
    }
  }

  return result;
}

function md5(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex").toUpperCase();
}

export function generatePayment9Sign(
  params: Record<string, string | number | undefined>,
  clientSecret = DEFAULT_PAYMENT9_CLIENT_SECRET
): string {
  const sortedString = sortParams(params);
  const stringToSign = `${clientSecret}${sortedString}${clientSecret}`;
  return md5(stringToSign);
}

export function verifyPayment9Sign(
  params: Record<string, string | number | undefined>,
  sign: string,
  clientSecret = DEFAULT_PAYMENT9_CLIENT_SECRET
): boolean {
  const expectedSign = generatePayment9Sign(params, clientSecret);
  return expectedSign === sign.toUpperCase();
}
