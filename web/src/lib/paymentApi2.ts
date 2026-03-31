import { generateOrderNo, generateSign, generateTimestamp, isProxyApiConfig, maskKey } from "./paymentApi";

export type UnifiedOrderResponse = {
  mchId: string | number;
  tradeNo: string;
  outTradeNo: string;
  amount: string | number;
  payUrl: string;
  extData?: string;
  sign?: string;
};

export type QueryOrderResponse = {
  mchId: string | number;
  productId: string | number;
  tradeNo: string;
  outTradeNo: string;
  amount: string | number;
  payAmount?: string | number;
  payUrl: string;
  createTime: string;
  payTime?: string;
  state: number;
  sign?: string;
};

export type QueryBalanceResponse = {
  mchId: string | number;
  balance: string | number;
  earnestBalance: string | number;
  pureEarnestBalance: string | number;
  sign?: string;
};

export type Payment2ApiResult<T> = {
  code: number;
  message: string;
  data?: T;
};

export type Payment2Callback = {
  id: number;
  mch_id: string;
  product_id: string;
  trade_no: string;
  out_trade_no: string;
  amount: string;
  pay_amount: string;
  state: number;
  create_time: string;
  pay_time: string | null;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type Payment2Config = {
  mchId: string;
  merchantKey: string;
  productId: string;
  notifyUrl: string;
  returnUrl: string;
  unifiedOrderApi: string;
  queryOrderApi: string;
  queryBalanceApi: string;
};

type Payment2ApiConfig = Pick<Payment2Config, "unifiedOrderApi" | "queryOrderApi" | "queryBalanceApi">;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const PAYMENT2_STATE_MAP: Record<number, string> = {
  0: "待支付",
  1: "支付成功",
  2: "支付失败",
  3: "未出码",
  4: "异常"
};

export function getPayment2ApiConfig(useProxy: boolean): Payment2ApiConfig {
  if (useProxy) {
    return {
      unifiedOrderApi: "/api/payment2-proxy/pay/unifiedOrder",
      queryOrderApi: "/api/payment2-proxy/pay/queryOrder",
      queryBalanceApi: "/api/payment2-proxy/merchant/queryBalance"
    };
  }

  return {
    unifiedOrderApi: "https://jkapi-shengxing.jkcbb.com/api/v1/pay/unifiedOrder",
    queryOrderApi: "https://jkapi-shengxing.jkcbb.com/api/v1/pay/queryOrder",
    queryBalanceApi: "https://jkapi-shengxing.jkcbb.com/api/v1/merchant/queryBalance"
  };
}

export function isProxyPayment2ApiConfig(config: Payment2ApiConfig): boolean {
  return isProxyApiConfig({
    collectOrderApi: config.unifiedOrderApi,
    collectOrderQueryApi: config.queryOrderApi,
    paymentOrderApi: config.queryBalanceApi,
    paymentOrderQueryApi: config.queryBalanceApi,
    merchantInfoApi: config.queryBalanceApi
  });
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment2ApiConfig(useProxy);

export const DEFAULT_PAYMENT2_CONFIG: Payment2Config = {
  mchId: "1104",
  merchantKey: "jkkxkMfSGAdlTYUOMaycCyj",
  productId: "T888",
  notifyUrl: "",
  returnUrl: "",
  ...defaultApiConfig
};

export const PAYMENT2_REQUEST_KEY = "jkkxkMfSGAdlTYUOMaycCyj";

export function getDefaultPayment2CallbackUrls(): { notifyUrl: string; returnUrl: string } {
  const origin = window.location.origin;

  return {
    notifyUrl: `${origin}/api/payment2/callback`,
    returnUrl: ""
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

export async function createUnifiedOrder(
  config: Payment2Config,
  params: {
    amount: string;
    outTradeNo?: string;
    userId?: string;
    userName?: string;
    userIp?: string;
  }
): Promise<Payment2ApiResult<UnifiedOrderResponse>> {
  const reqTime = String(generateTimestamp());
  const outTradeNo = (params.outTradeNo || generateOrderNo()).trim();
  const merchantKey = config.merchantKey.trim();

  const requestParams: Record<string, string | number | undefined> = {
    mchId: config.mchId.trim(),
    productId: config.productId.trim(),
    outTradeNo,
    amount: params.amount.trim(),
    reqTime,
    notifyUrl: config.notifyUrl.trim(),
    returnUrl: config.returnUrl.trim() || undefined,
    userId: params.userId?.trim() || undefined,
    userName: params.userName?.trim() || undefined,
    userIp: params.userIp?.trim() || undefined
  };

  const sign = generateSign(requestParams, merchantKey);

  const response = await fetch(config.unifiedOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...requestParams,
      sign,
      key: PAYMENT2_REQUEST_KEY
    })
  });

  return response.json();
}

export async function queryOrder(
  config: Payment2Config,
  outTradeNo: string
): Promise<Payment2ApiResult<QueryOrderResponse>> {
  const reqTime = String(generateTimestamp());
  const merchantKey = config.merchantKey.trim();

  const requestParams: Record<string, string | number | undefined> = {
    mchId: config.mchId.trim(),
    outTradeNo: outTradeNo.trim(),
    reqTime
  };

  const sign = generateSign(requestParams, merchantKey);

  const response = await fetch(config.queryOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...requestParams,
      sign,
      key: PAYMENT2_REQUEST_KEY
    })
  });

  return response.json();
}

export async function queryBalance(config: Payment2Config): Promise<Payment2ApiResult<QueryBalanceResponse>> {
  const reqTime = String(generateTimestamp());
  const merchantKey = config.merchantKey.trim();

  const requestParams: Record<string, string | number | undefined> = {
    mchId: config.mchId.trim(),
    reqTime
  };

  const sign = generateSign(requestParams, merchantKey);

  const response = await fetch(config.queryBalanceApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...requestParams,
      sign,
      key: PAYMENT2_REQUEST_KEY
    })
  });

  return response.json();
}

export async function fetchPayment2Callbacks(limit = 50): Promise<CallbackResponse<Payment2Callback[]>> {
  const response = await fetch(`/api/payment2/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment2Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment2/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { generateOrderNo, maskKey };
