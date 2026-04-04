import { md5, sortParams, isProxyApiConfig, maskKey } from "./paymentApi";

export type UnifiedOrderResponse = {
  status: number;
  msg: string;
  order_id: string;
  mch_order_id: string;
  h5_url?: string;
  sdk_url?: string;
  pay_url?: string;
};

export type QueryOrderResponse = {
  memberid: string;
  orderid: string;
  amount: string;
  time_end: string;
  transaction_id: string;
  returncode: string;
  trade_state: string;
  sign: string;
};

export type QueryBalanceResponse = {
  memberid: string;
  orderid: string;
  time: string;
  balance: string;
  blockedbalance: string;
  sign: string;
};

export type Payment5ApiResult<T> = {
  status?: number;
  msg?: string;
  message?: string;
  data?: T;
};

export type Payment5Callback = {
  id: number;
  memberid: string;
  orderid: string;
  amount: string;
  transaction_id: string;
  datetime: string;
  returncode: string;
  attach?: string;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export type Payment5Config = {
  mchId: string;
  merchantKey: string;
  bankCode: string;
  notifyUrl: string;
  callbackUrl: string;
  unifiedOrderApi: string;
  queryOrderApi: string;
  queryBalanceApi: string;
};

type Payment5ApiConfig = Pick<Payment5Config, "unifiedOrderApi" | "queryOrderApi" | "queryBalanceApi">;

type CallbackResponse<T> = {
  message: string;
  data: T;
};

export const TRADE_STATE_MAP: Record<string, string> = {
  NOTPAY: "未支付",
  SUCCESS: "已支付"
};

export const RETURN_CODE_MAP: Record<string, string> = {
  "00": "成功"
};

export function getPayment5ApiConfig(useProxy: boolean): Payment5ApiConfig {
  if (useProxy) {
    return {
      unifiedOrderApi: "/api/payment5-proxy/Pay_Index.html",
      queryOrderApi: "/api/payment5-proxy/Pay_Trade_query.html",
      queryBalanceApi: "/api/payment5-proxy/Pay_Trade_querymoney.html"
    };
  }

  return {
    unifiedOrderApi: "http://test.demo.sanguozf.com/Pay_Index.html",
    queryOrderApi: "http://test.demo.sanguozf.com/Pay_Trade_query.html",
    queryBalanceApi: "http://test.demo.sanguozf.com/Pay_Trade_querymoney.html"
  };
}

export function isProxyPayment5ApiConfig(config: Payment5ApiConfig): boolean {
  return isProxyApiConfig({
    collectOrderApi: config.unifiedOrderApi,
    collectOrderQueryApi: config.queryOrderApi,
    paymentOrderApi: config.queryBalanceApi,
    paymentOrderQueryApi: config.queryBalanceApi,
    merchantInfoApi: config.queryBalanceApi
  });
}

const useProxy = typeof window !== "undefined";
const defaultApiConfig = getPayment5ApiConfig(useProxy);

export const DEFAULT_PAYMENT5_CONFIG: Payment5Config = {
  mchId: "",
  merchantKey: "",
  bankCode: "",
  notifyUrl: "",
  callbackUrl: "",
  ...defaultApiConfig
};

export function getDefaultPayment5CallbackUrls(): { notifyUrl: string; callbackUrl: string } {
  const origin = window.location.origin;

  return {
    notifyUrl: `${origin}/api/payment5/callback`,
    callbackUrl: ""
  };
}

export function formatYuanToFen(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return "0";
  }

  return Math.round(numeric * 100).toString();
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

export function isValidYuanAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value.trim());
}

function formatDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generatePayment5Sign(
  params: Record<string, string | number | undefined>,
  merchantKey: string
): string {
  const sortedString = sortParams(params);
  const stringToSign = `${sortedString}&key=${merchantKey}`;
  return md5(stringToSign);
}

export function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `P5${timestamp}${random}`.substring(0, 20);
}

export async function createUnifiedOrder(
  config: Payment5Config,
  params: {
    amount: string;
    productName: string;
    outTradeNo?: string;
    userId?: string;
    userName?: string;
    userIp?: string;
  }
): Promise<Payment5ApiResult<UnifiedOrderResponse>> {
  const outTradeNo = (params.outTradeNo || generateOrderNo()).trim();
  const applyDate = formatDateTime();
  const merchantKey = config.merchantKey.trim();

  const signParams: Record<string, string | number | undefined> = {
    pay_memberid: config.mchId.trim(),
    pay_orderid: outTradeNo,
    pay_applydate: applyDate,
    pay_bankcode: config.bankCode.trim(),
    pay_notifyurl: config.notifyUrl.trim(),
    pay_callbackurl: config.callbackUrl.trim() || undefined,
    pay_amount: params.amount.trim()
  };

  const sign = generatePayment5Sign(signParams, merchantKey);

  const formData = new URLSearchParams();
  formData.append("pay_memberid", config.mchId.trim());
  formData.append("pay_orderid", outTradeNo);
  formData.append("pay_applydate", applyDate);
  formData.append("pay_bankcode", config.bankCode.trim());
  formData.append("pay_notifyurl", config.notifyUrl.trim());
  if (config.callbackUrl.trim()) {
    formData.append("pay_callbackurl", config.callbackUrl.trim());
  }
  formData.append("pay_amount", params.amount.trim());
  formData.append("pay_productname", params.productName.trim());
  formData.append("pay_ip", params.userIp?.trim() || "");
  formData.append("pay_md5sign", sign);
  if (params.userId?.trim()) {
    formData.append("pay_userid", params.userId.trim());
  }
  if (params.userName?.trim()) {
    formData.append("pay_username", params.userName.trim());
  }

  const response = await fetch(config.unifiedOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });

  return response.json();
}

export async function queryOrder(
  config: Payment5Config,
  outTradeNo: string
): Promise<Payment5ApiResult<QueryOrderResponse>> {
  const merchantKey = config.merchantKey.trim();

  const signParams: Record<string, string | number | undefined> = {
    pay_memberid: config.mchId.trim(),
    pay_orderid: outTradeNo.trim()
  };

  const sign = generatePayment5Sign(signParams, merchantKey);

  const formData = new URLSearchParams();
  formData.append("pay_memberid", config.mchId.trim());
  formData.append("pay_orderid", outTradeNo.trim());
  formData.append("pay_md5sign", sign);

  const response = await fetch(config.queryOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });

  return response.json();
}

export async function queryBalance(config: Payment5Config): Promise<Payment5ApiResult<QueryBalanceResponse>> {
  const applyDate = formatDateTime();
  const outTradeNo = generateOrderNo();
  const merchantKey = config.merchantKey.trim();

  const signParams: Record<string, string | number | undefined> = {
    pay_memberid: config.mchId.trim(),
    pay_orderid: outTradeNo,
    pay_applydate: applyDate
  };

  const sign = generatePayment5Sign(signParams, merchantKey);

  const formData = new URLSearchParams();
  formData.append("pay_memberid", config.mchId.trim());
  formData.append("pay_orderid", outTradeNo);
  formData.append("pay_applydate", applyDate);
  formData.append("pay_md5sign", sign);

  const response = await fetch(config.queryBalanceApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });

  return response.json();
}

export async function fetchPayment5Callbacks(limit = 50): Promise<CallbackResponse<Payment5Callback[]>> {
  const response = await fetch(`/api/payment5/callbacks?limit=${limit}`);
  return response.json();
}

export async function clearPayment5Callbacks(): Promise<CallbackResponse<null>> {
  const response = await fetch("/api/payment5/callbacks", {
    method: "DELETE"
  });

  return response.json();
}

export { maskKey };
