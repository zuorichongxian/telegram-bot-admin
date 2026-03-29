export type CollectOrderRequest = {
  merchantNo: string;
  channelCode: string;
  merchantOrderNo: string;
  orderAmount: string;
  notifyUrl: string;
  returnUrl?: string;
  payerName?: string;
  payerIp?: string;
  extParam?: string;
};

export type CollectOrderResponse = {
  merchantNo: string;
  timestamp: number;
  sign: string;
  channelCode?: string;
  systemOrderNo?: string;
  merchantOrderNo?: string;
  orderAmount: string;
  orderStatus: number;
  orderStatusDesc?: string;
  payUrl?: string;
  qrCodeUrl?: string;
};

export type CollectOrderQueryRequest = {
  merchantNo: string;
  merchantOrderNo: string;
};

export type CollectOrderQueryResponse = {
  merchantNo: string;
  systemOrderNo?: string;
  merchantOrderNo: string;
  orderAmount: string;
  orderStatus: number;
  orderStatusDesc?: string;
  createdAt?: string;
  paidAt?: string;
};

export type PaymentOrderRequest = {
  merchantNo: string;
  channelCode: string;
  merchantOrderNo: string;
  orderAmount: string;
  notifyUrl: string;
  returnUrl?: string;
  payeeAccountNo: string;
  payeeAccountName?: string;
  payeeBankCode?: string;
  extParam?: string;
};

export type PaymentOrderResponse = {
  merchantNo: string;
  timestamp: number;
  sign: string;
  systemOrderNo?: string;
  merchantOrderNo: string;
  orderAmount: string;
  orderStatus: number;
  orderStatusDesc?: string;
};

export type PaymentOrderQueryRequest = {
  merchantNo: string;
  merchantOrderNo: string;
};

export type PaymentOrderQueryResponse = {
  merchantNo: string;
  systemOrderNo?: string;
  merchantOrderNo: string;
  orderAmount: string;
  orderStatus: number;
  orderStatusDesc?: string;
  createdAt?: string;
  paidAt?: string;
};

export type MerchantInfoResponse = {
  merchantNo: string;
  merchantName?: string;
  balance?: string;
  frozenBalance?: string;
  status?: number;
  statusDesc?: string;
  createdAt?: string;
};

export type ApiResult<T> = {
  code: string;
  message: string;
  data?: T;
  traceId?: string;
};

export const ORDER_STATUS_MAP: Record<number, string> = {
  0: "已生成",
  1: "待接单",
  2: "已接单",
  3: "已成功",
  4: "已取消",
  5: "已超时",
  6: "高危订单",
  7: "渠道订单失败",
  8: "匹配失败"
};

export const DEFAULT_CONFIG = {
  merchantNo: "4760774446035387265",
  merchantKey: "OHeuY847UqsB2M8ul0bI2ZXTNwpFwcyt",
  channelCode: "",
  notifyUrl: "",
  returnUrl: "",
  collectOrderApi: "https://pay.fykkbb.xyz/order/api/v1/collectOrder/create",
  collectOrderQueryApi: "https://pay.fykkbb.xyz/order/api/v1/collectOrder/queryCollectOrder",
  paymentOrderApi: "https://pay.fykkbb.xyz/order/api/v1/paymentOrder/create",
  paymentOrderQueryApi: "https://pay.fykkbb.xyz/order/api/v1/paymentOrder/queryPaymentOrder",
  merchantInfoApi: "https://pay.fykkbb.xyz/order/api/v1/merchant"
};

export function getDefaultCallbackUrls(): { notifyUrl: string; returnUrl: string } {
  const backendUrl = window.location.origin;
  const frontendUrl = window.location.origin;

  return {
    notifyUrl: `${backendUrl}/api/payment/callback`,
    returnUrl: `${frontendUrl}/payment-result`
  };
}

export type PaymentCallback = {
  id: number;
  merchant_no: string;
  merchant_order_no: string;
  system_order_no: string | null;
  order_amount: string;
  order_status: number;
  sign: string;
  raw_data: string;
  verified: number;
  created_at: string;
};

export async function fetchPaymentCallbacks(limit = 50): Promise<ApiResult<PaymentCallback[]>> {
  const response = await fetch(`${window.location.origin}/api/payment/callbacks?limit=${limit}`);

  return response.json();
}

export async function clearPaymentCallbacks(): Promise<ApiResult<null>> {
  const response = await fetch(`${window.location.origin}/api/payment/callbacks`, {
    method: "DELETE"
  });

  return response.json();
}

async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.toUpperCase();
}

export function sortParams(params: Record<string, string | number | undefined>): string {
  const sortedKeys = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== "";
    })
    .sort((a, b) => a.localeCompare(b));

  const pairs: string[] = [];
  for (const key of sortedKeys) {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      pairs.push(`${key}=${value}`);
    }
  }

  return pairs.join("&");
}

export async function generateSign(
  params: Record<string, string | number | undefined>,
  merchantKey: string
): Promise<string> {
  const sortedString = sortParams(params);
  const stringToSign = `${sortedString}&key=${merchantKey}`;
  return md5(stringToSign);
}

export function generateOrderNo(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ORD${timestamp}${random}`;
}

export function generateTimestamp(): number {
  return Date.now();
}

export type PaymentConfig = {
  merchantNo: string;
  merchantKey: string;
  channelCode: string;
  notifyUrl: string;
  returnUrl: string;
  collectOrderApi: string;
  collectOrderQueryApi: string;
  paymentOrderApi: string;
  paymentOrderQueryApi: string;
  merchantInfoApi: string;
};

export async function createCollectOrder(
  config: PaymentConfig,
  params: {
    orderAmount: string;
    merchantOrderNo?: string;
    payerName?: string;
    payerIp?: string;
    extParam?: string;
  }
): Promise<ApiResult<CollectOrderResponse>> {
  const timestamp = generateTimestamp();
  const merchantOrderNo = params.merchantOrderNo || generateOrderNo();

  const requestParams: Record<string, string | number | undefined> = {
    merchantNo: config.merchantNo,
    timestamp,
    channelCode: config.channelCode,
    merchantOrderNo,
    orderAmount: params.orderAmount,
    notifyUrl: config.notifyUrl,
    returnUrl: config.returnUrl || undefined,
    payerName: params.payerName || undefined,
    payerIp: params.payerIp || undefined,
    extParam: params.extParam || undefined
  };

  const sign = await generateSign(requestParams, config.merchantKey);

  const requestBody = {
    ...requestParams,
    sign
  };

  const response = await fetch(config.collectOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  return response.json();
}

export async function queryCollectOrder(
  config: PaymentConfig,
  merchantOrderNo: string
): Promise<ApiResult<CollectOrderQueryResponse>> {
  const timestamp = generateTimestamp();

  const requestParams: Record<string, string | number | undefined> = {
    merchantNo: config.merchantNo,
    timestamp,
    merchantOrderNo
  };

  const sign = await generateSign(requestParams, config.merchantKey);

  const requestBody = {
    ...requestParams,
    sign
  };

  const response = await fetch(config.collectOrderQueryApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  return response.json();
}

export async function createPaymentOrder(
  config: PaymentConfig,
  params: {
    orderAmount: string;
    merchantOrderNo?: string;
    payeeAccountNo: string;
    payeeAccountName?: string;
    payeeBankCode?: string;
    extParam?: string;
  }
): Promise<ApiResult<PaymentOrderResponse>> {
  const timestamp = generateTimestamp();
  const merchantOrderNo = params.merchantOrderNo || generateOrderNo();

  const requestParams: Record<string, string | number | undefined> = {
    merchantNo: config.merchantNo,
    timestamp,
    channelCode: config.channelCode,
    merchantOrderNo,
    orderAmount: params.orderAmount,
    notifyUrl: config.notifyUrl,
    returnUrl: config.returnUrl || undefined,
    payeeAccountNo: params.payeeAccountNo,
    payeeAccountName: params.payeeAccountName || undefined,
    payeeBankCode: params.payeeBankCode || undefined,
    extParam: params.extParam || undefined
  };

  const sign = await generateSign(requestParams, config.merchantKey);

  const requestBody = {
    ...requestParams,
    sign
  };

  const response = await fetch(config.paymentOrderApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  return response.json();
}

export async function queryPaymentOrder(
  config: PaymentConfig,
  merchantOrderNo: string
): Promise<ApiResult<PaymentOrderQueryResponse>> {
  const timestamp = generateTimestamp();

  const requestParams: Record<string, string | number | undefined> = {
    merchantNo: config.merchantNo,
    timestamp,
    merchantOrderNo
  };

  const sign = await generateSign(requestParams, config.merchantKey);

  const requestBody = {
    ...requestParams,
    sign
  };

  const response = await fetch(config.paymentOrderQueryApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  return response.json();
}

export async function queryMerchantInfo(config: PaymentConfig): Promise<ApiResult<MerchantInfoResponse>> {
  const timestamp = generateTimestamp();

  const requestParams: Record<string, string | number | undefined> = {
    merchantNo: config.merchantNo,
    timestamp
  };

  const sign = await generateSign(requestParams, config.merchantKey);

  const requestBody = {
    ...requestParams,
    sign
  };

  const response = await fetch(config.merchantInfoApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  return response.json();
}

export function maskKey(key: string): string {
  if (key.length <= 8) {
    return "*".repeat(key.length);
  }
  return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4);
}
