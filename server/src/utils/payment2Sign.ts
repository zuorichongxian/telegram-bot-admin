import { generateSign, sortParams } from "./paymentSign.js";

export { sortParams };

export const DEFAULT_PAYMENT2_MERCHANT_KEY = "jkkxkMfSGAdlTYUOMaycCyj";

export function verifyPayment2Sign(
  params: Record<string, string | number | undefined>,
  sign: string,
  merchantKey = DEFAULT_PAYMENT2_MERCHANT_KEY
): boolean {
  const expectedSign = generateSign(params, merchantKey);
  return expectedSign.toUpperCase() === sign.toUpperCase();
}
