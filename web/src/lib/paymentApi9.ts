import { generateOrderNo, isProxyApiConfig, maskKey, md5 } from "./paymentApi";

export type UnifiedOrderResponse = {
  order_sn: string;
  api_order_sn: string;
  type: string;
  h5_url: string;
  qr_url: string;
};

export type QueryOrderResponse = {
  order_sn: string;
  total: string;
  type: string;
  is_pay: string;
};

export type Payment9Callback = {
  id: number;
  callbacks: string;
  type: string;
  total: string;
  api_order_sn: string;
  order_sn: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type Payment9Config = {
  clientId: string;
  merchantKey: string;
  payType: string;
  notifyUrl: string;
  unifiedOrderApi: string;
  queryOrderApi: string;
};

export type Payment9ApiResult<T> = {
  code: number;
  status: number;
  msg: string;
  data?: T;
};

type Payment9ApiConfig = Pick<Payment9Config, "unifiedOrderApi" | "queryOrderApi">;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const PAYMENT9_IS_PAY_MAP: Record<string, string> = {
  "0": "未支付",
  "1": "已支付"
};

export const PAYMENT9_CALLBACK_STATUS_MAP: Record<string, string> = {
  CODE_SUCCESS: "支付成功",
  CODE_FAILURE: "支付失败"
};

export function getPayment9ApiConfig(useProxy: boolean): Payment9ApiConfig {
  if (useProxy) {
    return {
      unifiedOrderApi: "/api/payment9-proxy/index/api/order.html",
      queryOrderApi: "/api/payment9-proxy/index/api/queryorder.html"
    };
  }

  return {
    unifiedOrderApi: "http://47.76.172.252:8083/index/api/order.html",
    queryOrderApi: "http://47.76.172.252:8083/index/api/queryorder.html"
  };
}

export function isProxyPayment9ApiConfig(config: Payment9ApiConfig): boolean {
  return isProxyApiConfig({
    collectOrderApi: config.unifiedOrderApi,
    collectOrderQueryApi: config.queryOrderApi,
    paymentOrderApi: config.queryOrderApi,
    paymentOrderQueryApi: config.queryOrderApi,
    merchantInfoApi: config.queryOrderApi
  });
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment9ApiConfig(useProxy);

export const DEFAULT_PAYMENT9_CONFIG: Payment9Config = {
  clientId: "d4b8ab0c8bde8263bc0781ebd3b56feb",
  merchantKey: "a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218",
  payType: "alipay",
  notifyUrl: "",
  ...defaultApiConfig
};

export function getDefaultPayment9CallbackUrls(): { notifyUrl: string } {
  const origin = window.location.origin;

  return { notifyUrl: `${origin}/api/payment9/callback` };
}

function sortParamsForSign(params: Record<string, string | number | undefined>): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => {
      const v = params[key];
      return v !== undefined && v !== null && v !== "";
    })
    .sort((a, b) => a.localeCompare(b));

  let result = "";
  for (const key of sortedKeys) {
    result += `${key}${params[key]}`;
  }

  return result;
}

function generatePayment9Sign(params: Record<string, string | number | undefined>, secret: string): string {
  const sortedString = sortParamsForSign(params);
  const stringToSign = `${secret}${sortedString}${secret}`;
  return md5(stringToSign).toUpperCase();
}

function toFormData(params: Record<string, string | number | undefined>): URLSearchParams {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  }
  return formData;
}

export async function createUnifiedOrder(
  config: Payment9Config,
  params: {
    total: number;
    apiOrderSn?: string;
  }
): Promise<Payment9ApiResult<UnifiedOrderResponse>> {
  const timestamp = String(Date.now());
  const apiOrderSn = (params.apiOrderSn || generateOrderNo()).trim();

  const requestParams: Record<string, string | number | undefined> = {
    type: config.payType.trim(),
    total: params.total,
    api_order_sn: apiOrderSn,
    notify_url: config.notifyUrl.trim(),
    client_id: config.clientId.trim(),
    timestamp
  };

  const sign = generatePayment9Sign(requestParams, config.merchantKey.trim());

  const bodyData = toFormData({ ...requestParams, sign });

  const response = await fetch(config.unifiedOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: bodyData.toString()
  });

  return response.json();
}

export async function queryOrder(
  config: Payment9Config,
  orderSn: string
): Promise<Payment9ApiResult<QueryOrderResponse>> {
  const timestamp = String(Date.now());

  const requestParams: Record<string, string | number | undefined> = {
    order_sn: orderSn.trim(),
    client_id: config.clientId.trim(),
    timestamp
  };

  const sign = generatePayment9Sign(requestParams, config.merchantKey.trim());

  const bodyData = toFormData({ ...requestParams, sign });

  const response = await fetch(config.queryOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: bodyData.toString()
  });

  return response.json();
}

export async function fetchPayment9Callbacks(limit = 50): Promise<CallbackResponse<Payment9Callback[]>> {
  const response = await fetch(`/api/payment9/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment9Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment9/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { generateOrderNo, maskKey };
