import { generateOrderNo, generateTimestamp, maskKey, md5Hash } from "./paymentApi";

export type Payment3OrderResponse = {
  ptOrderNum: string;
  payUrl: string;
};

export type Payment3QueryResponse = {
  account: string;
  product: string;
  ptOrderNum: string;
  orderId: string;
  price: string | number;
  status: string | number;
};

export type Payment3ApiResult<T> = {
  success: boolean;
  code: number;
  message: string;
  data?: T;
};

export type Payment3Callback = {
  id: number;
  account: string;
  order_id: string;
  pt_order_num: string;
  product: string;
  price: string;
  status: number;
  time: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type Payment3Config = {
  account: string;
  merchantKey: string;
  product: string;
  notifyUrl: string;
  returnUrl: string;
  orderApi: string;
  queryApi: string;
};

type Payment3ApiConfig = Pick<Payment3Config, "orderApi" | "queryApi">;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const PAYMENT3_STATUS_MAP: Record<number, string> = {
  2: "支付成功"
};

export function getPayment3ApiConfig(useProxy: boolean): Payment3ApiConfig {
  if (useProxy) {
    return {
      orderApi: "/api/payment3-proxy/pay/open/order",
      queryApi: "/api/payment3-proxy/pay/open/query"
    };
  }

  return {
    orderApi: "http://47.57.185.38/openapi/pay/open/order",
    queryApi: "http://47.57.185.38/openapi/pay/open/query"
  };
}

export function isProxyPayment3ApiConfig(config: Payment3ApiConfig): boolean {
  return config.orderApi.startsWith("/api/payment3-proxy");
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment3ApiConfig(useProxy);

export const DEFAULT_PAYMENT3_CONFIG: Payment3Config = {
  account: "4c0d753c6",
  merchantKey: "415eb007e4994998a0d46e63d44c8039",
  product: "zfb",
  notifyUrl: "",
  returnUrl: "",
  ...defaultApiConfig
};

export function getDefaultPayment3CallbackUrls(): { notifyUrl: string; returnUrl: string } {
  const origin = window.location.origin;

  return {
    notifyUrl: `${origin}/api/payment3/callback`,
    returnUrl: `${origin}/payment-result`
  };
}

export function formatFenToYuan(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "0.00";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "0.00";
  }

  return (numeric / 100).toFixed(2);
}

export function isValidFenAmount(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

function lowerMd5(text: string): string {
  return md5Hash(text).toLowerCase();
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
  merchantKey: string
): string {
  return lowerMd5(
    `${params.account}${params.product}${params.orderId}${params.price}${params.notifyUrl}${params.time}${merchantKey.trim()}`
  );
}

export function generatePayment3QuerySign(
  params: {
    account: string;
    orderId: string;
  },
  merchantKey: string
): string {
  return lowerMd5(`${params.account}${params.orderId}${merchantKey.trim()}`);
}

export async function createPayment3Order(
  config: Payment3Config,
  params: {
    price: string;
    orderId?: string;
    clientIp?: string;
    clientType?: string;
    goodDescribe?: string;
    extraParams?: string;
  }
): Promise<Payment3ApiResult<Payment3OrderResponse>> {
  const orderId = (params.orderId || generateOrderNo()).trim();
  const time = String(generateTimestamp());

  const requestParams: Record<string, string> = {
    account: config.account.trim(),
    orderId,
    product: config.product.trim(),
    price: params.price.trim(),
    notifyUrl: config.notifyUrl.trim(),
    returnUrl: config.returnUrl.trim(),
    clientIp: params.clientIp?.trim() || "127.0.0.1",
    clientType: params.clientType?.trim() || "Android",
    time,
    goodDescribe: params.goodDescribe?.trim() || "",
    extraParams: params.extraParams?.trim() || ""
  };

  const sign = generatePayment3OrderSign(
    {
      account: requestParams.account,
      product: requestParams.product,
      orderId: requestParams.orderId,
      price: requestParams.price,
      notifyUrl: requestParams.notifyUrl,
      time: requestParams.time
    },
    config.merchantKey
  );

  const response = await fetch(config.orderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...requestParams,
      sign
    })
  });

  return response.json();
}

export async function queryPayment3Order(
  config: Payment3Config,
  orderId: string
): Promise<Payment3ApiResult<Payment3QueryResponse>> {
  const requestParams = {
    account: config.account.trim(),
    orderId: orderId.trim()
  };

  const sign = generatePayment3QuerySign(requestParams, config.merchantKey);

  const response = await fetch(config.queryApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...requestParams,
      sign
    })
  });

  return response.json();
}

export async function fetchPayment3Callbacks(limit = 50): Promise<CallbackResponse<Payment3Callback[]>> {
  const response = await fetch(`/api/payment3/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment3Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment3/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { generateOrderNo, maskKey };
