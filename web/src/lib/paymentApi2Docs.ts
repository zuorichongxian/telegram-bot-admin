import type { ApiDocInterface, ApiDocParam } from "./paymentApiDocs";

const commonResponseParams: ApiDocParam[] = [
  {
    fieldName: "返回状态码",
    variableName: "code",
    required: true,
    type: "int",
    example: "0",
    description: "网关返回码：0=成功，其他为失败"
  },
  {
    fieldName: "返回信息",
    variableName: "message",
    required: true,
    type: "string",
    example: "查询成功",
    description: "具体错误原因或成功提示"
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

export const payment2InterfaceRules = [
  { name: "请求方式", value: "POST / JSON" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "分" },
  { name: "签名算法", value: "MD5，32位，不区分大小写" }
];

export const payment2OrderStates = [
  { code: 0, desc: "待支付" },
  { code: 1, desc: "支付成功" },
  { code: 2, desc: "支付失败" },
  { code: 3, desc: "未出码" },
  { code: 4, desc: "异常" }
];

export const payment2SignRules = [
  "所有非空参数按参数名 ASCII 码从小到大排序。",
  "拼接格式为 key1=value1&key2=value2。",
  "末尾追加 &key=商户密钥 后做 MD5。",
  "空值和空字符串不参与签名。",
  "接口扩展的新字段只要非空也必须参与签名。"
];

export const payment2ApiDocs: ApiDocInterface[] = [
  {
    name: "统一下单",
    url: "https://jkapi-shengxing.jkcbb.com/api/v1/pay/unifiedOrder",
    method: "POST",
    description: "发起支付收款订单，网关返回支付地址给商户展示。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "通道类型", variableName: "productId", required: true, type: "string", example: "T888", description: "支付测试编码" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "JK00001", description: "商户系统生成的唯一订单号" },
        { fieldName: "支付金额", variableName: "amount", required: true, type: "int", example: "100", description: "单位为分，例如 100 表示 1.00 元" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1735704000000", description: "13 位毫秒时间戳" },
        { fieldName: "异步通知地址", variableName: "notifyUrl", required: true, type: "string", example: "https://test.com/notify", description: "支付成功后的异步回调地址" },
        { fieldName: "跳转通知地址", variableName: "returnUrl", required: false, type: "string", example: "https://test.com/return", description: "支付结果同步跳转地址" },
        { fieldName: "商户用户 ID", variableName: "userId", required: false, type: "string", example: "USER_001", description: "最大 32 个字符" },
        { fieldName: "商户用户姓名", variableName: "userName", required: false, type: "string", example: "小明", description: "付款用户姓名" },
        { fieldName: "商户用户 IP", variableName: "userIp", required: false, type: "string", example: "1.1.1.1", description: "支持 IPV6" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "签名值，不参与签名" }
        ,
        { fieldName: "商户秘钥", variableName: "key", required: true, type: "string", example: "jkkxkMfSGAdlTYUOMaycCyj", description: "请求体附带的 key 参数" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "支付订单号", variableName: "tradeNo", required: true, type: "string", example: "JK0001", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "SH0001", description: "商户传入的订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "int", example: "100", description: "单位为分" },
        { fieldName: "支付地址", variableName: "payUrl", required: true, type: "string", example: "https://test.com/payurl", description: "商户展示给付款用户的支付链接" },
        { fieldName: "扩展内容", variableName: "extData", required: false, type: "string", example: "", description: "扩展字段" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "对 data 非空字段签名" }
      ]
    }
  },
  {
    name: "查询订单",
    url: "https://jkapi-shengxing.jkcbb.com/api/v1/pay/queryOrder",
    method: "POST",
    description: "查询订单最新状态与支付结果。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "SH00001", description: "统一下单时传入的订单号" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1735704000000", description: "13 位毫秒时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "签名值，不参与签名" },
        { fieldName: "商户秘钥", variableName: "key", required: true, type: "string", example: "jkkxkMfSGAdlTYUOMaycCyj", description: "请求体附带的 key 参数" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "通道类型", variableName: "productId", required: true, type: "int", example: "888", description: "通道类型" },
        { fieldName: "支付订单号", variableName: "tradeNo", required: true, type: "string", example: "JK00001", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "SH00001", description: "商户传入的订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "int", example: "100", description: "单位为分" },
        { fieldName: "支付金额", variableName: "payAmount", required: false, type: "int", example: "100", description: "订单实际支付金额，单位为分" },
        { fieldName: "支付地址", variableName: "payUrl", required: true, type: "string", example: "https://www.test.com/payurl", description: "付款链接" },
        { fieldName: "下单时间", variableName: "createTime", required: true, type: "string", example: "2025/01/01 12:00:00", description: "下单时间" },
        { fieldName: "支付成功时间", variableName: "payTime", required: false, type: "string", example: "2025/01/01 12:00:00", description: "支付成功时间" },
        { fieldName: "订单状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待支付，1=支付成功，2=支付失败，3=未出码，4=异常" },
        { fieldName: "签名", variableName: "sign", required: false, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "对 data 非空字段签名" }
      ]
    }
  },
  {
    name: "余额查询",
    url: "https://jkapi-shengxing.jkcbb.com/api/v1/merchant/queryBalance",
    method: "POST",
    description: "查询商户余额、预付和净预付。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "请求时间", variableName: "reqTime", required: true, type: "long", example: "1735704000000", description: "13 位毫秒时间戳" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "签名值，不参与签名" },
        { fieldName: "商户秘钥", variableName: "key", required: true, type: "string", example: "jkkxkMfSGAdlTYUOMaycCyj", description: "请求体附带的 key 参数" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "余额", variableName: "balance", required: true, type: "string", example: "10000", description: "单位为分" },
        { fieldName: "预付", variableName: "earnestBalance", required: true, type: "string", example: "10000", description: "单位为分" },
        { fieldName: "净预付", variableName: "pureEarnestBalance", required: true, type: "string", example: "10000", description: "单位为分" },
        { fieldName: "签名", variableName: "sign", required: false, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "对 data 非空字段签名" }
      ]
    }
  },
  {
    name: "支付通知",
    url: "商户在 unifiedOrder 中传入 notifyUrl",
    method: "POST",
    description: "支付成功后平台向商户发起异步通知，商户需返回 SUCCESS 或 OK。",
    request: {
      title: "通知参数",
      params: [
        { fieldName: "商户号", variableName: "mchId", required: true, type: "string", example: "1104", description: "商户号" },
        { fieldName: "支付通道 ID", variableName: "productId", required: true, type: "string", example: "888", description: "支付通道 ID" },
        { fieldName: "支付订单号", variableName: "tradeNo", required: true, type: "string", example: "P00001", description: "支付系统订单号" },
        { fieldName: "商户订单号", variableName: "outTradeNo", required: true, type: "string", example: "SH00001", description: "商户传入订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "int", example: "100", description: "单位为分" },
        { fieldName: "实际支付金额", variableName: "payAmount", required: true, type: "int", example: "100", description: "上分请使用这个金额" },
        { fieldName: "订单状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待支付，1=成功" },
        { fieldName: "订单创建时间", variableName: "createTime", required: true, type: "string", example: "2025/01/01 12:00:00", description: "格式 yyyy/MM/dd HH:mm:ss" },
        { fieldName: "订单支付时间", variableName: "payTime", required: true, type: "string", example: "2025/01/01 12:00:00", description: "格式 yyyy/MM/dd HH:mm:ss" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "f52ab92457b1a97c1dbbc794de8dea8e", description: "签名值，不参与签名" }
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
