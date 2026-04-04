import { generateOrderNo, generateTimestamp, maskKey, md5Hash } from "./paymentApi";

export type Payment4OrderResponse = {
  payUrl: string;
};

export type Payment4QueryResponse = {
  merchantId: string;
  orderId: string;
  status: string;
  msg?: string;
  amount?: string | number;
  sign?: string;
};

export type Payment4ApiResult<T> = {
  code: number;
  msg: string;
  data?: T;
};

export type Payment4Callback = {
  id: number;
  merchant_id: string;
  order_id: string;
  amount: string;
  status: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type Payment4Config = {
  merchantId: string;
  merchantKey: string;
  channelType: string;
  notifyUrl: string;
  returnUrl: string;
  newOrderApi: string;
  queryOrderApi: string;
  queryOrderV2Api: string;
};

type Payment4ApiConfig = Pick<Payment4Config, "newOrderApi" | "queryOrderApi" | "queryOrderV2Api">;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const PAYMENT4_STATUS_MAP: Record<string, string> = {
  paid: "支付成功",
  unpaid: "未支付",
  ok: "回调成功"
};

export function getPayment4ApiConfig(useProxy: boolean): Payment4ApiConfig {
  if (useProxy) {
    return {
      newOrderApi: "/api/payment4-proxy/newOrder",
      queryOrderApi: "/api/payment4-proxy/queryOrder",
      queryOrderV2Api: "/api/payment4-proxy/queryOrderV2"
    };
  }

  return {
    newOrderApi: "http://xiaohuob.aspay.one/api/newOrder",
    queryOrderApi: "http://xiaohuob.aspay.one/api/queryOrder",
    queryOrderV2Api: "http://xiaohuob.aspay.one/api/queryOrderV2"
  };
}

export function isProxyPayment4ApiConfig(config: Payment4ApiConfig): boolean {
  return config.newOrderApi.startsWith("/api/payment4-proxy");
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment4ApiConfig(useProxy);

export const DEFAULT_PAYMENT4_CONFIG: Payment4Config = {
  merchantId: "10036",
  merchantKey: "6ee404fc1a6ff2bbaf0b197a3810cead",
  channelType: "",
  notifyUrl: "",
  returnUrl: "",
  ...defaultApiConfig
};

export function getDefaultPayment4CallbackUrls(): { notifyUrl: string; returnUrl: string } {
  const origin = window.location.origin;

  return {
    notifyUrl: `${origin}/api/payment4/callback`,
    returnUrl: `${origin}/payment-result`
  };
}

export function formatYuanToText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const normalized = Number(trimmed);
  if (!Number.isFinite(normalized)) {
    return trimmed;
  }

  return normalized.toFixed(2).replace(/\.00$/, "");
}

export function isValidYuanAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value.trim());
}

function generatePayment4Sign(params: Record<string, string | number | undefined>, merchantKey: string): string {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  const payload = filtered.map(([key, value]) => `${key}=${value}`).join("&");
  return md5Hash(`${payload}&key=${merchantKey.trim()}`).toLowerCase();
}

export async function createPayment4Order(
  config: Payment4Config,
  params: {
    orderAmount: string;
    orderId?: string;
    payerIp?: string;
    payerId?: string;
    orderTitle?: string;
    orderBody?: string;
    isForm?: string;
  }
): Promise<Payment4ApiResult<Payment4OrderResponse>> {
  const orderId = (params.orderId || generateOrderNo()).trim();

  const requestParams: Record<string, string | number | undefined> = {
    merchantId: config.merchantId.trim(),
    orderId,
    orderAmount: params.orderAmount.trim(),
    channelType: config.channelType.trim(),
    notifyUrl: config.notifyUrl.trim(),
    returnUrl: config.returnUrl.trim() || undefined,
    isForm: params.isForm?.trim() || "2",
    payer_ip: params.payerIp?.trim() || undefined,
    payer_id: params.payerId?.trim() || undefined,
    order_title: params.orderTitle?.trim() || undefined,
    order_body: params.orderBody?.trim() || undefined,
    time: String(generateTimestamp())
  };

  const sign = generatePayment4Sign(requestParams, config.merchantKey);

  const response = await fetch(config.newOrderApi, {
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

export async function queryPayment4Order(
  config: Payment4Config,
  orderId: string,
  useV2 = false
): Promise<Payment4ApiResult<Payment4QueryResponse>> {
  const requestParams: Record<string, string> = {
    merchantId: config.merchantId.trim(),
    orderId: orderId.trim()
  };

  const sign = generatePayment4Sign(requestParams, config.merchantKey);

  const response = await fetch(useV2 ? config.queryOrderV2Api : config.queryOrderApi, {
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

export async function fetchPayment4Callbacks(limit = 50): Promise<CallbackResponse<Payment4Callback[]>> {
  const response = await fetch(`/api/payment4/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment4Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment4/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { generateOrderNo, maskKey };
