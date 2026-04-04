import { generateSign, sortParams } from "./paymentSign.js";

export { sortParams };

export const DEFAULT_PAYMENT5_MERCHANT_KEY = "4o9hbhxpprz4cnfrxowxps7rgyu4wauy";

export function verifyPayment5Sign(
  params: Record<string, string | number | undefined>,
  sign: string,
  merchantKey = DEFAULT_PAYMENT5_MERCHANT_KEY
): boolean {
  const expectedSign = generateSign(params, merchantKey);
  return expectedSign.toUpperCase() === sign.toUpperCase();
}
