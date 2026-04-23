import type { ApiDocInterface, ApiDocParam } from "./paymentApiDocs";

const commonResponseParams: ApiDocParam[] = [
  {
    fieldName: "返回状态码",
    variableName: "code",
    required: true,
    type: "int",
    example: "0",
    description: "网关返回码：0=成功，其他失败"
  },
  {
    fieldName: "返回信息",
    variableName: "message",
    required: true,
    type: "string",
    example: "签名失败",
    description: "具体错误原因"
  },
  {
    fieldName: "响应签名",
    variableName: "sign",
    required: false,
    type: "string",
    example: "694da7a446ab4b1d9ceea7e5614694f4",
    description: "对 data 内非空字段签名，data 为空时可不返回"
  },
  {
    fieldName: "响应数据",
    variableName: "data",
    required: false,
    type: "object",
    example: "{}",
    description: "业务返回数据"
  }
];

export const payment10InterfaceRules = [
  { name: "请求方式", value: "POST / JSON" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "分" },
  { name: "签名算法", value: "MD5 32位小写" }
];

export const payment10OrderStates = [
  { code: 0, desc: "待支付" },
  { code: 1, desc: "支付成功" },
  { code: 2, desc: "支付失败" },
  { code: 3, desc: "未出码" },
  { code: 4, desc: "异常" }
];

export const payment10NotifyStates = [
  { code: 0, desc: "未通知" },
  { code: 1, desc: "通知成功" },
  { code: 2, desc: "通知失败" }
];

export const payment10SignRules = [
  "所有非空参数值按照参数名 ASCII 码从小到大排序（字典序）。",
  "按 key=value 形式使用 & 连接成明文字符串。",
  "末尾追加 &key=商户密钥 后做 MD5，签名结果使用 32 位小写。",
  "空值和空字符串不参与签名。",
  "sign 字段本身不参与签名。",
  "接口后续新增字段时，非空字段也必须参与签名。"
];

export const payment10ApiDocs: ApiDocInterface[] = [
  {
    name: "统一下单",
    url: "https://pay.fqavxqzt.xyz/api/pay/unifiedorder",
    method: "POST",
    description: "发起支付收款订单，网关根据配置通道返回 payUrl 供用户支付。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "通道类型", variableName: "wayCode", required: true, type: "int", example: "1100", description: "通道编码" },
        { fieldName: "商品标题", variableName: "subject", required: true, type: "string", example: "商品标题测试", description: "商品标题" },
        { fieldName: "商品描述", variableName: "body", required: false, type: "string", example: "商品描述测试", description: "商品描述" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "ORD202604230001", description: "商户系统唯一订单号" },
        { fieldName: "支付金额", variableName: "amount", required: true, type: "int", example: "100", description: "金额单位：分" },
        { fieldName: "扩展参数", variableName: "extParam", required: false, type: "string", example: "USER_1001", description: "回调原样返回" },
        { fieldName: "客户端IP", variableName: "clientIp", required: true, type: "string", example: "8.8.8.8", description: "支持 IPv4/IPv6" },
        { fieldName: "异步回调地址", variableName: "notifyUrl", required: true, type: "string", example: "https://example.com/notify", description: "支付结果异步通知地址" },
        { fieldName: "同步跳转地址", variableName: "returnUrl", required: false, type: "string", example: "https://example.com/return", description: "支付结果同步跳转地址" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "支付订单号", variableName: "tradeNo", required: true, type: "string", example: "P202109052329398641190", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "ORD202604230001", description: "商户订单号" },
        { fieldName: "通道订单号", variableName: "originTradeNo", required: false, type: "string", example: "1434537241715146752", description: "支付通道订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "string", example: "100", description: "金额单位：分" },
        { fieldName: "支付地址", variableName: "payUrl", required: true, type: "string", example: "https://www.test.com/payurl", description: "商户展示给付款用户的支付链接" },
        { fieldName: "订单过期时间", variableName: "expiredTime", required: true, type: "string", example: "1713879000000", description: "13 位时间戳" },
        { fieldName: "SDK 参数", variableName: "sdkData", required: false, type: "string", example: "{}", description: "特定通道返回" }
      ]
    }
  },
  {
    name: "查询订单",
    url: "https://pay.fqavxqzt.xyz/api/pay/query",
    method: "POST",
    description: "按商户订单号查询订单最新状态和回调状态。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "ORD202604230001", description: "统一下单时订单号" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "通道类型", variableName: "wayCode", required: true, type: "int", example: "1100", description: "通道编码" },
        { fieldName: "支付订单号", variableName: "tradeNo", required: true, type: "string", example: "P202109052329398641190", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "ORD202604230001", description: "商户订单号" },
        { fieldName: "通道订单号", variableName: "originTradeNo", required: false, type: "string", example: "1434537241715146752", description: "通道订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "string", example: "100", description: "金额单位：分" },
        { fieldName: "商品标题", variableName: "subject", required: true, type: "string", example: "商品标题测试", description: "商品标题" },
        { fieldName: "商品描述", variableName: "body", required: false, type: "string", example: "商品描述测试", description: "商品描述" },
        { fieldName: "扩展参数", variableName: "extParam", required: false, type: "string", example: "USER_1001", description: "回调原样返回" },
        { fieldName: "异步通知地址", variableName: "notifyUrl", required: false, type: "string", example: "https://example.com/notify", description: "异步通知地址" },
        { fieldName: "支付地址", variableName: "payUrl", required: true, type: "string", example: "https://www.test.com/payurl", description: "支付链接" },
        { fieldName: "订单过期时间", variableName: "expiredTime", required: true, type: "string", example: "1713879000000", description: "13 位时间戳" },
        { fieldName: "支付成功时间", variableName: "successTime", required: false, type: "string", example: "1713878460000", description: "13 位时间戳" },
        { fieldName: "下单时间", variableName: "createTime", required: true, type: "string", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "订单状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待支付 1=支付成功 2=支付失败 3=未出码 4=异常" },
        { fieldName: "通知状态", variableName: "notifyState", required: true, type: "int", example: "1", description: "0=未通知 1=通知成功 2=通知失败" }
      ]
    }
  },
  {
    name: "余额查询",
    url: "https://pay.fqavxqzt.xyz/api/mch/balance",
    method: "POST",
    description: "查询商户账户余额、预付款和剩余余额。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "账户余额", variableName: "accountBalance", required: true, type: "string", example: "10000", description: "金额单位：分" },
        { fieldName: "预付款", variableName: "deposit", required: true, type: "string", example: "10000", description: "金额单位：分" },
        { fieldName: "剩余余额", variableName: "balance", required: true, type: "string", example: "10000", description: "账户余额-预付款（分）" }
      ]
    }
  },
  {
    name: "支付通知",
    url: "商户在 unifiedorder 中传入 notifyUrl",
    method: "POST",
    description: "支付成功后平台异步回调商户，商户需返回 SUCCESS 或 OK（大小写不敏感）。",
    request: {
      title: "通知参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "支付订单号", variableName: "tradeNo", required: true, type: "string", example: "P202109052329398641190", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "ORD202604230001", description: "商户订单号" },
        { fieldName: "通道订单号", variableName: "originTradeNo", required: false, type: "string", example: "1434537241715146752", description: "通道订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "long", example: "100", description: "金额单位：分" },
        { fieldName: "商品标题", variableName: "subject", required: true, type: "string", example: "商品标题测试", description: "商品标题" },
        { fieldName: "商品描述", variableName: "body", required: false, type: "string", example: "商品描述测试", description: "商品描述" },
        { fieldName: "扩展参数", variableName: "extParam", required: false, type: "string", example: "USER_1001", description: "回调原样返回" },
        { fieldName: "订单状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待支付 1=支付成功 2=支付失败 3=未出码 4=异常" },
        { fieldName: "通知时间", variableName: "notifyTime", required: true, type: "long", example: "1713878460000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" }
      ]
    },
    response: {
      title: "商户响应",
      params: [
        { fieldName: "响应体", variableName: "body", required: true, type: "string", example: "SUCCESS", description: "返回 SUCCESS 或 OK 则平台停止重试" }
      ]
    }
  },
  {
    name: "提现申请（文档）",
    url: "https://pay.fqavxqzt.xyz/api/mch/withdraw/apply",
    method: "POST",
    description: "商户提现申请接口（本页面仅展示文档，不提供操作表单）。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" },
        { fieldName: "商户提现单号", variableName: "outTradeNo", required: true, type: "string", example: "T202604230001", description: "商户生成的提现单号" },
        { fieldName: "提现金额", variableName: "amount", required: true, type: "int", example: "10000", description: "金额单位：分" },
        { fieldName: "银行名称", variableName: "bankName", required: true, type: "string", example: "中国建设银行", description: "银行名称" },
        { fieldName: "户名", variableName: "cardName", required: true, type: "string", example: "张三", description: "银行卡账户名称" },
        { fieldName: "账号", variableName: "cardNo", required: true, type: "string", example: "6217001730082128680", description: "银行卡卡号" },
        { fieldName: "开户行支行", variableName: "branchName", required: true, type: "string", example: "建设银行xxx支行", description: "开户行支行" },
        { fieldName: "异步通知地址", variableName: "notifyUrl", required: true, type: "string", example: "https://example.com/withdraw-notify", description: "审核结果异步通知地址" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    }
  },
  {
    name: "提现查询（文档）",
    url: "https://pay.fqavxqzt.xyz/api/mch/withdraw/query",
    method: "POST",
    description: "查询提现申请状态（本页面仅展示文档，不提供操作表单）。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" },
        { fieldName: "商户提现单号", variableName: "outTradeNo", required: true, type: "string", example: "T202604230001", description: "提现申请单号" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    }
  },
  {
    name: "提现通知（文档）",
    url: "商户在 withdraw/apply 中传入 notifyUrl",
    method: "POST",
    description: "提现审核后平台异步通知商户（本页面仅展示文档）。",
    request: {
      title: "通知参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "M1776937137", description: "商户号" },
        { fieldName: "提现单号", variableName: "tradeNo", required: true, type: "string", example: "1024", description: "平台提现单号" },
        { fieldName: "商户提现单号", variableName: "outTradeNo", required: true, type: "string", example: "T202604230001", description: "商户提现单号" },
        { fieldName: "提现金额", variableName: "amount", required: true, type: "int", example: "10000", description: "金额单位：分" },
        { fieldName: "提现服务费", variableName: "commissionFee", required: true, type: "int", example: "200", description: "金额单位：分" },
        { fieldName: "状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待审核 1=已完成 2=已取消" },
        { fieldName: "申请时间", variableName: "createTime", required: true, type: "long", example: "1713878400000", description: "13 位时间戳" },
        { fieldName: "审核时间", variableName: "completeTime", required: false, type: "long", example: "1713879000000", description: "13 位时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "694da7a446ab4b1d9ceea7e5614694f4", description: "签名值" }
      ]
    },
    response: {
      title: "商户响应",
      params: [
        { fieldName: "响应体", variableName: "body", required: true, type: "string", example: "SUCCESS", description: "返回 SUCCESS 或 OK 则平台停止重试" }
      ]
    }
  }
];
