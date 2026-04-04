import type { ApiDocInterface, ApiDocParam } from "./paymentApiDocs";

const commonResponseParams: ApiDocParam[] = [
  {
    fieldName: "是否成功",
    variableName: "success",
    required: true,
    type: "boolean",
    example: "true",
    description: "操作结果"
  },
  {
    fieldName: "响应码",
    variableName: "code",
    required: true,
    type: "int",
    example: "0",
    description: "0 表示成功，其他表示失败"
  },
  {
    fieldName: "提示信息",
    variableName: "message",
    required: true,
    type: "string",
    example: "操作成功",
    description: "错误或成功描述"
  },
  {
    fieldName: "业务数据",
    variableName: "data",
    required: false,
    type: "object",
    example: "{}",
    description: "成功时返回数据"
  }
];

export const payment3InterfaceRules = [
  { name: "请求方式", value: "POST / JSON" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "分" },
  { name: "签名算法", value: "MD5 小写" }
];

export const payment3OrderStates = [
  { code: 2, desc: "支付成功" }
];

export const payment3SignRules = [
  "下单签名：md5(account + product + orderId + price + notifyUrl + time + 商户秘钥)",
  "查询签名：md5(account + orderId + 商户秘钥)",
  "回调签名：md5(account + orderId + ptOrderNum + product + price + status + time + 商户秘钥)",
  "签名建议统一按文档示例输出为小写字符串"
];

export const payment3ApiDocs: ApiDocInterface[] = [
  {
    name: "订单支付",
    url: "http://47.57.185.38/openapi/pay/open/order",
    method: "POST",
    description: "发起收款订单，成功后返回支付链接。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "account", required: true, type: "string", example: "4c0d753c6", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604010001", description: "商户侧唯一订单号" },
        { fieldName: "支付产品编码", variableName: "product", required: true, type: "string", example: "zfb", description: "支付产品编码" },
        { fieldName: "支付金额", variableName: "price", required: true, type: "int", example: "100", description: "单位分，100=1.00 元" },
        { fieldName: "跳转地址", variableName: "returnUrl", required: false, type: "string", example: "https://example.com/return", description: "同步跳转通知地址" },
        { fieldName: "回调地址", variableName: "notifyUrl", required: true, type: "string", example: "https://example.com/notify", description: "异步回调地址" },
        { fieldName: "客户端 IP", variableName: "clientIp", required: true, type: "string", example: "8.8.8.8", description: "客户端 IPv4 地址" },
        { fieldName: "客户端类型", variableName: "clientType", required: true, type: "string", example: "Android", description: "Android/iPhone 等" },
        { fieldName: "时间戳", variableName: "time", required: true, type: "string", example: "1712200000000", description: "13 位毫秒时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "fd0d...", description: "md5(account+product+orderId+price+notifyUrl+time+key)" },
        { fieldName: "商品描述", variableName: "goodDescribe", required: false, type: "string", example: "充值", description: "商品描述" },
        { fieldName: "扩展参数", variableName: "extraParams", required: false, type: "string", example: "from=web", description: "透传参数" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "平台订单号", variableName: "ptOrderNum", required: true, type: "string", example: "PAY65516EB03FD88A39B681A704", description: "支付系统订单号" },
        { fieldName: "支付链接", variableName: "payUrl", required: true, type: "string", example: "https://...", description: "用户支付地址" }
      ]
    }
  },
  {
    name: "支付查询",
    url: "http://47.57.185.38/openapi/pay/open/query",
    method: "POST",
    description: "按商户订单号查询支付结果。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "account", required: true, type: "string", example: "4c0d753c6", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604010001", description: "下单时的订单号" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "68e6...", description: "md5(account+orderId+key)" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "account", required: true, type: "string", example: "4c0d753c6", description: "商户号" },
        { fieldName: "支付产品编码", variableName: "product", required: true, type: "string", example: "zfb", description: "支付产品编码" },
        { fieldName: "平台订单号", variableName: "ptOrderNum", required: true, type: "string", example: "PAY65516...", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604010001", description: "商户订单号" },
        { fieldName: "订单金额", variableName: "price", required: true, type: "int", example: "100", description: "单位分" },
        { fieldName: "支付状态", variableName: "status", required: true, type: "int", example: "2", description: "2=支付成功" }
      ]
    }
  },
  {
    name: "支付回调",
    url: "notifyUrl（商户下单时传入）",
    method: "POST",
    description: "支付成功后平台回调商户，商户需返回 success（小写）避免重复通知。",
    request: {
      title: "回调参数",
      params: [
        { fieldName: "商户号", variableName: "account", required: true, type: "string", example: "4c0d753c6", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604010001", description: "商户订单号" },
        { fieldName: "平台订单号", variableName: "ptOrderNum", required: true, type: "string", example: "PAY65516...", description: "支付系统订单号" },
        { fieldName: "支付产品编码", variableName: "product", required: true, type: "string", example: "zfb", description: "支付产品编码" },
        { fieldName: "支付金额", variableName: "price", required: true, type: "int", example: "100", description: "单位分" },
        { fieldName: "支付状态", variableName: "status", required: true, type: "int", example: "2", description: "2=支付成功" },
        { fieldName: "时间戳", variableName: "time", required: true, type: "string", example: "1712200000000", description: "13 位毫秒时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "6df3...", description: "md5(account+orderId+ptOrderNum+product+price+status+time+key)" }
      ]
    },
    response: {
      title: "商户响应",
      params: [
        { fieldName: "响应体", variableName: "body", required: true, type: "string", example: "success", description: "回调成功需返回 success（小写）" }
      ]
    }
  }
];
