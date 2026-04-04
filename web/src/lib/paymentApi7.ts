import { generateOrderNo, generateSign, generateTimestamp, isProxyApiConfig, maskKey } from "./paymentApi";

export type UnifiedOrderResponse = {
  mch_id: string | number;
  trade_no: string;
  out_trade_no: string;
  amount: string | number;
  pay_url: string;
  ext_data?: string;
  sign?: string;
};

export type QueryOrderResponse = {
  mch_id: string | number;
  product_id: string | number;
  trade_no: string;
  out_trade_no: string;
  amount: string | number;
  pay_amount?: string | number;
  pay_url: string;
  create_time: string;
  pay_time?: string;
  state: number;
  sign?: string;
};

export type QueryBalanceResponse = {
  mch_id: string | number;
  balance: string | number;
  earnest_balance: string | number;
  pure_earnest_balance: string | number;
  sign?: string;
};

export type Payment7ApiResult<T> = {
  code: number;
  message: string;
  data?: T;
};

export type Payment7Callback = {
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

export type Payment7Config = {
  mchId: string;
  merchantKey: string;
  productId: string;
  notifyUrl: string;
  returnUrl: string;
  unifiedOrderApi: string;
  queryOrderApi: string;
  queryBalanceApi: string;
};

type Payment7ApiConfig = Pick<Payment7Config, "unifiedOrderApi" | "queryOrderApi" | "queryBalanceApi">;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const PAYMENT7_STATE_MAP: Record<number, string> = {
  0: "待支付",
  1: "支付成功",
  2: "支付失败",
  3: "未出码",
  4: "异常"
};

export function getPayment7ApiConfig(useProxy: boolean): Payment7ApiConfig {
  if (useProxy) {
    return {
      unifiedOrderApi: "/api/payment5-proxy/Pay_Index.html",
      queryOrderApi: "/api/payment5-proxy/Pay_Trade_query.html",
      queryBalanceApi: "/api/payment5-proxy/user.html"
    };
  }

  return {
    unifiedOrderApi: "http://test.demo.sanguozf.com/Pay_Index.html",
    queryOrderApi: "http://test.demo.sanguozf.com/Pay_Trade_query.html",
    queryBalanceApi: "http://test.demo.sanguozf.com/user.html"
  };
}

export function isProxyPayment7ApiConfig(config: Payment7ApiConfig): boolean {
  return isProxyApiConfig({
    collectOrderApi: config.unifiedOrderApi,
    collectOrderQueryApi: config.queryOrderApi,
    paymentOrderApi: config.queryBalanceApi,
    paymentOrderQueryApi: config.queryBalanceApi,
    merchantInfoApi: config.queryBalanceApi
  });
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment7ApiConfig(useProxy);

export const DEFAULT_PAYMENT7_CONFIG: Payment7Config = {
  mchId: "260506688",
  merchantKey: "7pcgb193qvmd0oqmxxrjg4ude5l0cxtf",
  productId: "",
  notifyUrl: "",
  returnUrl: "",
  ...defaultApiConfig
};

export function getDefaultPayment7CallbackUrls(): { notifyUrl: string; returnUrl: string } {
  const origin = window.location.origin;

  return {
    notifyUrl: `${origin}/api/payment5/callback`,
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
  config: Payment7Config,
  params: {
    amount: string;
    outTradeNo?: string;
    userId?: string;
    userName?: string;
    userIp?: string;
  }
): Promise<Payment7ApiResult<UnifiedOrderResponse>> {
  const reqTime = String(generateTimestamp());
  const outTradeNo = (params.outTradeNo || generateOrderNo()).trim();
  const merchantKey = config.merchantKey.trim();

  const requestParams: Record<string, string | number | undefined> = {
    mch_id: config.mchId.trim(),
    out_trade_no: outTradeNo,
    amount: params.amount.trim(),
    reqTime,
    notify_url: config.notifyUrl.trim(),
    return_url: config.returnUrl.trim() || undefined
  };

  const sign = generateSign(requestParams, merchantKey);

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
  config: Payment7Config,
  outTradeNo: string
): Promise<Payment7ApiResult<QueryOrderResponse>> {
  const reqTime = String(generateTimestamp());
  const merchantKey = config.merchantKey.trim();

  const requestParams: Record<string, string | number | undefined> = {
    mch_id: config.mchId.trim(),
    out_trade_no: outTradeNo.trim(),
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
      sign
    })
  });

  return response.json();
}

export async function queryBalance(config: Payment7Config): Promise<Payment7ApiResult<QueryBalanceResponse>> {
  const reqTime = String(generateTimestamp());
  const merchantKey = config.merchantKey.trim();

  const requestParams: Record<string, string | number | undefined> = {
    mch_id: config.mchId.trim(),
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
      sign
    })
  });

  return response.json();
}

export async function fetchPayment7Callbacks(limit = 50): Promise<CallbackResponse<Payment7Callback[]>> {
  const response = await fetch(`/api/payment5/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment7Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment5/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { generateOrderNo, generateSign, generateTimestamp, maskKey };
