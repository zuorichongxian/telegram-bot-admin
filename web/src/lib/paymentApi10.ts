import {
  generateOrderNo,
  generateTimestamp,
  isProxyApiConfig,
  maskKey,
  md5
} from "./paymentApi";

export type UnifiedOrderResponse = {
  mchId: string | number;
  tradeNo: string;
  outTradeNo: string;
  originTradeNo?: string;
  amount: string | number;
  payUrl: string;
  expiredTime?: string | number;
  sdkData?: string;
  sign?: string;
};

export type QueryOrderResponse = {
  mchId: string | number;
  wayCode: string | number;
  tradeNo: string;
  outTradeNo: string;
  originTradeNo?: string;
  amount: string | number;
  subject: string;
  body?: string;
  extParam?: string;
  notifyUrl?: string;
  payUrl: string;
  expiredTime: string | number;
  successTime?: string | number;
  createTime: string | number;
  state: number;
  notifyState: number;
  sign?: string;
};

export type QueryBalanceResponse = {
  accountBalance: string | number;
  deposit: string | number;
  balance: string | number;
  sign?: string;
};

export type Payment10ApiResult<T> = {
  code: number;
  message: string;
  sign?: string;
  data?: T;
};

export type Payment10Callback = {
  id: number;
  mch_id: string;
  trade_no: string;
  out_trade_no: string;
  origin_trade_no: string | null;
  amount: string;
  subject: string;
  body: string | null;
  ext_param: string | null;
  state: number;
  notify_time: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type Payment10Config = {
  mchId: string;
  merchantKey: string;
  wayCode: string;
  notifyUrl: string;
  returnUrl: string;
  unifiedOrderApi: string;
  queryOrderApi: string;
  queryBalanceApi: string;
};

type Payment10ApiConfig = Pick<
  Payment10Config,
  "unifiedOrderApi" | "queryOrderApi" | "queryBalanceApi"
>;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const PAYMENT10_STATE_MAP: Record<number, string> = {
  0: "待支付",
  1: "支付成功",
  2: "支付失败",
  3: "未出码",
  4: "异常"
};

export const PAYMENT10_NOTIFY_STATE_MAP: Record<number, string> = {
  0: "未通知",
  1: "通知成功",
  2: "通知失败"
};

export function getPayment10ApiConfig(useProxy: boolean): Payment10ApiConfig {
  if (useProxy) {
    return {
      unifiedOrderApi: "/api/payment10-proxy/pay/unifiedorder",
      queryOrderApi: "/api/payment10-proxy/pay/query",
      queryBalanceApi: "/api/payment10-proxy/mch/balance"
    };
  }

  return {
    unifiedOrderApi: "https://pay.fqavxqzt.xyz/api/pay/unifiedorder",
    queryOrderApi: "https://pay.fqavxqzt.xyz/api/pay/query",
    queryBalanceApi: "https://pay.fqavxqzt.xyz/api/mch/balance"
  };
}

export function isProxyPayment10ApiConfig(config: Payment10ApiConfig): boolean {
  return isProxyApiConfig({
    collectOrderApi: config.unifiedOrderApi,
    collectOrderQueryApi: config.queryOrderApi,
    paymentOrderApi: config.queryBalanceApi,
    paymentOrderQueryApi: config.queryBalanceApi,
    merchantInfoApi: config.queryBalanceApi
  });
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment10ApiConfig(useProxy);

export const DEFAULT_PAYMENT10_CONFIG: Payment10Config = {
  mchId: "M1776937137",
  merchantKey: "ab08ede2a8164d1885860399c8814d48",
  wayCode: "1100",
  notifyUrl: "",
  returnUrl: "",
  ...defaultApiConfig
};

export function getDefaultPayment10CallbackUrls(): {
  notifyUrl: string;
  returnUrl: string;
} {
  const origin = window.location.origin;

  return {
    notifyUrl: `${origin}/api/payment10/callback`,
    returnUrl: ""
  };
}

function stringifySignValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

function sortParamsForSign(
  params: Record<string, unknown>
): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => stringifySignValue(params[key]) !== undefined)
    .sort((a, b) => a.localeCompare(b));

  const pairs: string[] = [];
  for (const key of sortedKeys) {
    const value = stringifySignValue(params[key]);
    if (value !== undefined) {
      pairs.push(`${key}=${value}`);
    }
  }

  return pairs.join("&");
}

export function generatePayment10Sign(
  params: Record<string, unknown>,
  merchantKey: string
): string {
  const sortedString = sortParamsForSign(params);
  const toSign = sortedString
    ? `${sortedString}&key=${merchantKey}`
    : `key=${merchantKey}`;
  return md5(toSign).toLowerCase();
}

export function formatFenToYuan(
  value: string | number | null | undefined
): string {
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

function normalizeWayCode(raw: string): string | number {
  const trimmed = raw.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : trimmed;
}

export async function createUnifiedOrder(
  config: Payment10Config,
  params: {
    amount: string;
    outTradeNo?: string;
    subject: string;
    body?: string;
    extParam?: string;
    clientIp: string;
  }
): Promise<Payment10ApiResult<UnifiedOrderResponse>> {
  const reqTime = generateTimestamp();
  const outTradeNo = (params.outTradeNo || generateOrderNo()).trim();
  const wayCodeValue =
    config.wayCode.trim() || DEFAULT_PAYMENT10_CONFIG.wayCode;
  const normalizedWayCode = Number(normalizeWayCode(wayCodeValue));
  const normalizedAmount = Number(params.amount.trim());

  const requestParams: Record<string, unknown> = {
    mchId: config.mchId.trim(),
    // 保证统一下单始终携带 wayCode，避免网关判定缺参
    wayCode: normalizedWayCode,
    subject: params.subject.trim(),
    body: params.body?.trim() || undefined,
    outTradeNo,
    amount: normalizedAmount,
    extParam: params.extParam?.trim() || undefined,
    clientIp: params.clientIp.trim(),
    notifyUrl: config.notifyUrl.trim(),
    returnUrl: config.returnUrl.trim() || undefined,
    reqTime
  };

  const sign = generatePayment10Sign(requestParams, config.merchantKey.trim());

  const response = await fetch(config.unifiedOrderApi, {
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

export async function queryOrder(
  config: Payment10Config,
  outTradeNo: string
): Promise<Payment10ApiResult<QueryOrderResponse>> {
  const reqTime = generateTimestamp();

  const requestParams: Record<string, unknown> = {
    mchId: config.mchId.trim(),
    outTradeNo: outTradeNo.trim(),
    reqTime
  };

  const sign = generatePayment10Sign(requestParams, config.merchantKey.trim());

  const response = await fetch(config.queryOrderApi, {
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

export async function queryBalance(
  config: Payment10Config
): Promise<Payment10ApiResult<QueryBalanceResponse>> {
  const reqTime = generateTimestamp();

  const requestParams: Record<string, unknown> = {
    mchId: config.mchId.trim(),
    reqTime
  };

  const sign = generatePayment10Sign(requestParams, config.merchantKey.trim());

  const response = await fetch(config.queryBalanceApi, {
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

export async function fetchPayment10Callbacks(
  limit = 50
): Promise<CallbackResponse<Payment10Callback[]>> {
  const response = await fetch(`/api/payment10/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment10Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment10/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { generateOrderNo, maskKey };
