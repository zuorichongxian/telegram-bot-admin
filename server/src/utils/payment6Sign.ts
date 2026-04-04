import { generateSign, sortParams } from "./paymentSign.js";

export { sortParams };

export const DEFAULT_PAYMENT6_MERCHANT_KEY = "jkkGqwL7SbpRMZ7cviD8oZn";

export function verifyPayment6Sign(
  params: Record<string, string | number | undefined>,
  sign: string,
  merchantKey = DEFAULT_PAYMENT6_MERCHANT_KEY
): boolean {
  const expectedSign = generateSign(params, merchantKey);
  return expectedSign.toUpperCase() === sign.toUpperCase();
}
