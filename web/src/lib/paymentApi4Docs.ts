import type { ApiDocInterface, ApiDocParam } from "./paymentApiDocs";

const commonResponseParams: ApiDocParam[] = [
  {
    fieldName: "响应码",
    variableName: "code",
    required: true,
    type: "int",
    example: "200",
    description: "200 表示请求处理成功，500 表示处理失败"
  },
  {
    fieldName: "提示信息",
    variableName: "msg",
    required: true,
    type: "string",
    example: "查询成功",
    description: "中文提示描述"
  },
  {
    fieldName: "业务数据",
    variableName: "data",
    required: false,
    type: "object|string",
    example: "{}",
    description: "成功时通常返回对象，失败可能为空字符串"
  }
];

export const payment4InterfaceRules = [
  { name: "请求方式", value: "POST / JSON（回调为 form）" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "元（最多2位小数）" },
  { name: "签名算法", value: "去空 + ASCII升序 + &key=商户密钥 + MD5小写" }
];

export const payment4OrderStates = [
  { code: "paid", desc: "已支付" },
  { code: "unpaid", desc: "未支付" },
  { code: "ok", desc: "回调成功（回调场景）" }
];

export const payment4SignRules = [
  "公共签名：参数去空后按 ASCII 升序拼接为 key1=value1&key2=value2",
  "尾部追加 &key=商户密钥，再做 MD5，结果转小写",
  "下单、查单、查单V2、回调验签都使用同一签名规则",
  "回调处理成功后返回小写 ok 或 success"
];

export const payment4ApiDocs: ApiDocInterface[] = [
  {
    name: "下单接口",
    url: "http://xiaohuob.aspay.one/api/newOrder",
    method: "POST",
    description: "发起收款订单，成功后返回 payUrl。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "merchantId", required: true, type: "string", example: "10036", description: "商户后台可见" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604040001", description: "10-50位，需唯一" },
        { fieldName: "订单金额", variableName: "orderAmount", required: true, type: "string", example: "1.00", description: "单位元，最多2位小数" },
        { fieldName: "通道编号", variableName: "channelType", required: true, type: "string", example: "1001", description: "商户后台查看" },
        { fieldName: "异步通知地址", variableName: "notifyUrl", required: true, type: "string", example: "https://example.com/notify", description: "支付后服务器通知" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "8a2...", description: "按公共签名规则" },
        { fieldName: "同步跳转地址", variableName: "returnUrl", required: false, type: "string", example: "https://example.com/return", description: "可选" },
        { fieldName: "期望返回类型", variableName: "isForm", required: false, type: "string", example: "2", description: "1=form直跳，2=json返回payUrl" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "支付链接", variableName: "payUrl", required: true, type: "string", example: "https://...", description: "收银台支付地址" }
      ]
    }
  },
  {
    name: "查单接口（新）",
    url: "http://xiaohuob.aspay.one/api/queryOrderV2",
    method: "POST",
    description: "推荐使用，返回 amount 字段。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "merchantId", required: true, type: "string", example: "10036", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604040001", description: "下单时订单号" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "9bf...", description: "按公共签名规则" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "merchantId", required: true, type: "string", example: "10036", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604040001", description: "订单号" },
        { fieldName: "订单状态", variableName: "status", required: true, type: "string", example: "paid", description: "paid/unpaid" },
        { fieldName: "订单金额", variableName: "amount", required: false, type: "string", example: "1.00", description: "V2 返回金额" },
        { fieldName: "状态描述", variableName: "msg", required: false, type: "string", example: "已支付", description: "状态描述" }
      ]
    }
  },
  {
    name: "查单接口（旧）",
    url: "http://xiaohuob.aspay.one/api/queryOrder",
    method: "POST",
    description: "历史接口，不返回 amount。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "merchantId", required: true, type: "string", example: "10036", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604040001", description: "下单时订单号" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "9bf...", description: "按公共签名规则" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    }
  },
  {
    name: "支付回调",
    url: "notifyUrl（下单时传入）",
    method: "POST(form)",
    description: "支付成功后服务器异步通知，字段 status 固定为 ok。",
    request: {
      title: "回调参数",
      params: [
        { fieldName: "商户号", variableName: "merchantId", required: true, type: "string", example: "10036", description: "商户号" },
        { fieldName: "商户订单号", variableName: "orderId", required: true, type: "string", example: "ORD202604040001", description: "订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, type: "string", example: "1.00", description: "订单金额（元）" },
        { fieldName: "订单状态", variableName: "status", required: true, type: "string", example: "ok", description: "固定 ok" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "ab3...", description: "按公共签名规则" }
      ]
    },
    response: {
      title: "商户响应",
      params: [
        { fieldName: "响应体", variableName: "body", required: true, type: "string", example: "success", description: "返回 ok 或 success（小写）" }
      ]
    }
  }
];
