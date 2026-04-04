import crypto from "node:crypto";

export const DEFAULT_PAYMENT3_MERCHANT_KEY = "415eb007e4994998a0d46e63d44c8039";

function md5Lower(message: string): string {
  return crypto.createHash("md5").update(message).digest("hex").toLowerCase();
}

export function generatePayment3OrderSign(
  params: {
    account: string;
    product: string;
    orderId: string;
    price: string;
    notifyUrl: string;
    time: string;
  },
  merchantKey = DEFAULT_PAYMENT3_MERCHANT_KEY
): string {
  return md5Lower(
    `${params.account}${params.product}${params.orderId}${params.price}${params.notifyUrl}${params.time}${merchantKey}`
  );
}

export function generatePayment3QuerySign(
  params: {
    account: string;
    orderId: string;
  },
  merchantKey = DEFAULT_PAYMENT3_MERCHANT_KEY
): string {
  return md5Lower(`${params.account}${params.orderId}${merchantKey}`);
}

export function generatePayment3CallbackSign(
  params: {
    account: string;
    orderId: string;
    ptOrderNum: string;
    product: string;
    price: string;
    status: string;
    time: string;
  },
  merchantKey = DEFAULT_PAYMENT3_MERCHANT_KEY
): string {
  return md5Lower(
    `${params.account}${params.orderId}${params.ptOrderNum}${params.product}${params.price}${params.status}${params.time}${merchantKey}`
  );
}

export function verifyPayment3CallbackSign(
  params: {
    account: string;
    orderId: string;
    ptOrderNum: string;
    product: string;
    price: string;
    status: string;
    time: string;
  },
  sign: string,
  merchantKey = DEFAULT_PAYMENT3_MERCHANT_KEY
): boolean {
  return generatePayment3CallbackSign(params, merchantKey) === sign.toLowerCase();
}
