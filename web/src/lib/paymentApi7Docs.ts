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

export const payment7InterfaceRules = [
  { name: "请求方式", value: "POST / JSON" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "元" },
  { name: "签名算法", value: "MD5，32位，不区分大小写" },
  { name: "商户名称", value: "金安" },
  { name: "商务号", value: "260506688" },
  { name: "回调IP", value: "8.210.110.78,47.242.129.100,47.242.223.11" },
  { name: "通道编码", value: "102" },
  { name: "固定面额", value: "50, 100, 200" }
];

export const payment7OrderStates = [
  { code: 0, desc: "待支付" },
  { code: 1, desc: "支付成功" },
  { code: 2, desc: "支付失败" },
  { code: 3, desc: "未出码" },
  { code: 4, desc: "异常" }
];

export const payment7SignRules = [
  "所有非空参数按参数名 ASCII 码从小到大排序。",
  "拼接格式为 key1=value1&key2=value2。",
  "末尾追加 &key=商户密钥 后做 MD5。",
  "空值和空字符串不参与签名。",
  "sign 字段本身不参与签名。",
  "接口扩展的新字段只要非空也必须参与签名。"
];

export const payment7ApiDocs: ApiDocInterface[] = [
  {
    name: "统一下单",
    url: "http://test.demo.sanguozf.comIndex.html",
    method: "POST",
    description: "接单测试7 - 金安支付通道：发起支付收款订单，网关返回支付地址给商户展示。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mch_id", required: true, type: "string", example: "260506688", description: "商务号" },
        { fieldName: "通道类型", variableName: "pay_type", required: true, type: "string", example: "102", description: "支付通道编码（固定面额：50, 100, 200）" },
        { fieldName: "商户订单号", variableName: "out_trade_no", required: true, type: "string", example: "FX20260101001", description: "商户系统生成的唯一订单号" },
        { fieldName: "支付金额", variableName: "order_amount", required: true, type: "string", example: "100.00", description: "单位为元，精确到小数点后2位（支持面额：50, 100, 200）" },
        { fieldName: "请求时间", variableName: "req_time", required: true, type: "string", example: "2026-01-01 12:00:00", description: "请求时间，格式 yyyy-MM-dd HH:mm:ss" },
        { fieldName: "异步通知地址", variableName: "notify_url", required: true, type: "string", example: "https://test.com/notify", description: "支付成功后的异步回调地址" },
        { fieldName: "跳转通知地址", variableName: "return_url", required: false, type: "string", example: "https://test.com/return", description: "支付结果同步跳转地址" },
        { fieldName: "商户用户 ID", variableName: "attach", required: false, type: "string", example: "USER_001", description: "商户附加参数，回调原样返回" },
        { fieldName: "客户端 IP", variableName: "client_ip", required: false, type: "string", example: "1.1.1.1", description: "付款用户 IP 地址" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", description: "签名值，不参与签名" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mch_id", required: true, type: "string", example: "260506688", description: "商户号" },
        { fieldName: "商户订单号", variableName: "out_trade_no", required: true, type: "string", example: "FX20260101001", description: "商户传入的订单号" },
        { fieldName: "平台订单号", variableName: "trade_no", required: true, type: "string", example: "FX202601010000001", description: "平台生成的订单号" },
        { fieldName: "订单金额", variableName: "order_amount", required: true, type: "string", example: "100.00", description: "单位为元" },
        { fieldName: "支付地址", variableName: "pay_url", required: true, type: "string", example: "https://test.com/payurl", description: "商户展示给付款用户的支付链接" },
        { fieldName: "二维码内容", variableName: "qr_code", required: false, type: "string", example: "", description: "支付二维码内容" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", description: "对 data 非空字段签名" }
      ]
    }
  },
  {
    name: "查询订单",
    url: "http://test.demo.sanguozf.comTrade_query.html",
    method: "POST",
    description: "查询订单最新状态与支付结果。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "mch_id", required: true, type: "string", example: "260506688", description: "商户号" },
        { fieldName: "商户订单号", variableName: "out_trade_no", required: true, type: "string", example: "FX20260101001", description: "统一下单时传入的订单号" },
        { fieldName: "请求时间", variableName: "req_time", required: true, type: "string", example: "2026-01-01 12:00:00", description: "请求时间，格式 yyyy-MM-dd HH:mm:ss" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", description: "签名值，不参与签名" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "商户号", variableName: "mch_id", required: true, type: "string", example: "260506688", description: "商户号" },
        { fieldName: "平台订单号", variableName: "trade_no", required: true, type: "string", example: "FX202601010000001", description: "平台订单号" },
        { fieldName: "商户订单号", variableName: "out_trade_no", required: true, type: "string", example: "FX20260101001", description: "商户传入的订单号" },
        { fieldName: "订单金额", variableName: "order_amount", required: true, type: "string", example: "100.00", description: "单位为元" },
        { fieldName: "实际支付金额", variableName: "pay_amount", required: false, type: "string", example: "100.00", description: "实际支付金额，单位为元" },
        { fieldName: "下单时间", variableName: "create_time", required: true, type: "string", example: "2026/01/01 12:00:00", description: "下单时间" },
        { fieldName: "支付成功时间", variableName: "pay_time", required: false, type: "string", example: "2026/01/01 12:05:00", description: "支付成功时间" },
        { fieldName: "订单状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待支付，1=支付成功，2=支付失败，3=未出码，4=异常" },
        { fieldName: "签名", variableName: "sign", required: false, type: "string", example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", description: "对 data 非空字段签名" }
      ]
    }
  },
  {
    name: "支付通知",
    url: "商户在统一下单中传入 notify_url",
    method: "POST",
    description: "支付成功后平台向商户发起异步通知，商户需返回 SUCCESS 或 OK。回调IP白名单：8.210.110.78,47.242.129.100,47.242.223.11",
    request: {
      title: "通知参数",
      params: [
        { fieldName: "商户号", variableName: "mch_id", required: true, type: "string", example: "260506688", description: "商户号" },
        { fieldName: "平台订单号", variableName: "trade_no", required: true, type: "string", example: "FX202601010000001", description: "平台订单号" },
        { fieldName: "商户订单号", variableName: "out_trade_no", required: true, type: "string", example: "FX20260101001", description: "商户传入订单号" },
        { fieldName: "订单金额", variableName: "order_amount", required: true, type: "string", example: "100.00", description: "单位为元" },
        { fieldName: "实际支付金额", variableName: "pay_amount", required: true, type: "string", example: "100.00", description: "实际支付金额，上分请使用此金额" },
        { fieldName: "订单状态", variableName: "state", required: true, type: "int", example: "1", description: "0=待支付，1=支付成功" },
        { fieldName: "订单创建时间", variableName: "create_time", required: true, type: "string", example: "2026/01/01 12:00:00", description: "格式 yyyy/MM/dd HH:mm:ss" },
        { fieldName: "订单支付时间", variableName: "pay_time", required: true, type: "string", example: "2026/01/01 12:05:00", description: "格式 yyyy/MM/dd HH:mm:ss" },
        { fieldName: "签名", variableName: "sign", required: true, type: "string", example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6", description: "签名值，不参与签名" }
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
