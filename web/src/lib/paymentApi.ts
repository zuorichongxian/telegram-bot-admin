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

// 根据环境判断使用代理还是直接访问
// 生产环境也使用后端代理，避免 CORS 问题
const useProxy = typeof window !== 'undefined';

export const DEFAULT_CONFIG = {
  merchantNo: "4760774446035387265",
  merchantKey: "OHeuY847UqsB2M8ul0bI2ZXTNwpFwcyt",
  channelCode: "",
  notifyUrl: "",
  returnUrl: "",
  // 所有环境都使用后端代理，避免 CORS 问题
  collectOrderApi: useProxy 
    ? "/api/payment-proxy/collectOrder/create" 
    : "https://pay.fykkbb.xyz/order/api/v1/collectOrder/create",
  collectOrderQueryApi: useProxy 
    ? "/api/payment-proxy/collectOrder/queryCollectOrder" 
    : "https://pay.fykkbb.xyz/order/api/v1/collectOrder/queryCollectOrder",
  paymentOrderApi: useProxy 
    ? "/api/payment-proxy/paymentOrder/create" 
    : "https://pay.fykkbb.xyz/order/api/v1/paymentOrder/create",
  paymentOrderQueryApi: useProxy 
    ? "/api/payment-proxy/paymentOrder/queryPaymentOrder" 
    : "https://pay.fykkbb.xyz/order/api/v1/paymentOrder/queryPaymentOrder",
  merchantInfoApi: useProxy 
    ? "/api/payment-proxy/merchant" 
    : "https://pay.fykkbb.xyz/order/api/v1/merchant"
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

function md5(message: string): string {
  // 纯 JavaScript MD5 实现，避免浏览器 crypto.subtle 兼容性问题
  function rotateLeft(lValue: number, iShiftBits: number): number {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }

  function addUnsigned(lX: number, lY: number): number {
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }

  function f(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, f(b, c, d)), x), s), ac);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, g(b, c, d)), x), s), ac);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, h(b, c, d)), x), s), ac);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, i(b, c, d)), x), s), ac);
  }

  function convertToWordArray(string: string): number[] {
    let lWordCount: number;
    const lMessageLength = string.length;
    const lNumberOfWordsTemp1 = lMessageLength + 8;
    const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    const lWordArray = new Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number): string {
    let wordToHexValue = "",
      wordToHexValueTemp = "",
      lByte,
      lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValueTemp = "0" + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
    }
    return wordToHexValue;
  }

  let x: number[] = [];
  let k: number, AA: number, BB: number, CC: number, DD: number, a: number, b: number, c: number, d: number;
  const S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22;
  const S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20;
  const S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23;
  const S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;

  x = convertToWordArray(message);
  a = 0x67452301;
  b = 0xefcdab89;
  c = 0x98badcfe;
  d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x4881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  const tempValue = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  return tempValue.toUpperCase();
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

export function generateSign(
  params: Record<string, string | number | undefined>,
  merchantKey: string
): string {
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

  const sign = generateSign(requestParams, config.merchantKey);

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

  const sign = generateSign(requestParams, config.merchantKey);

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

  const sign = generateSign(requestParams, config.merchantKey);

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

  const sign = generateSign(requestParams, config.merchantKey);

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

  const sign = generateSign(requestParams, config.merchantKey);

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
