import type { ApiDocInterface } from "./paymentApiDocs";

export const payment5InterfaceRules = [
  { name: "请求方式", value: "POST / form-data" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "元" },
  { name: "签名算法", value: "MD5，32位，大写" }
];

export const payment5OrderStates = [
  { code: "NOTPAY", desc: "未支付" },
  { code: "SUCCESS", desc: "已支付" }
];

export const payment5SignRules = [
  "所有需要参与签名的字段按参数名 ASCII 码从小到大排序。",
  "拼接格式为 key1=value1&key2=value2。",
  "末尾追加 &key=商户密钥 后做 MD5，结果转大写。",
  "空值和空字符串不参与签名。",
  "pay_md5sign 字段本身不参与签名。"
];

export const payment5ApiDocs: ApiDocInterface[] = [
  {
    name: "订单请求",
    url: "网站地址/Pay_Index.html",
    method: "POST",
    description: "发起支付收款订单，网关返回支付地址给商户展示。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "pay_memberid", required: true, sign: true, type: "string", example: "260505221", description: "平台分配商户号" },
        { fieldName: "订单号", variableName: "pay_orderid", required: true, sign: true, type: "string", example: "FX20260101001", description: "上送订单号唯一，字符长度20" },
        { fieldName: "提交时间", variableName: "pay_applydate", required: true, sign: true, type: "string", example: "2026-01-01 12:00:00", description: "时间格式：2016-12-26 18:18:18" },
        { fieldName: "银行编码", variableName: "pay_bankcode", required: true, sign: true, type: "string", example: "wxpay", description: "参考后续说明" },
        { fieldName: "服务端通知", variableName: "pay_notifyurl", required: true, sign: true, type: "string", example: "https://test.com/notify", description: "服务端返回地址（POST返回数据）" },
        { fieldName: "页面跳转通知", variableName: "pay_callbackurl", required: true, sign: true, type: "string", example: "https://test.com/return", description: "页面跳转返回地址（POST返回数据）" },
        { fieldName: "订单金额", variableName: "pay_amount", required: true, sign: true, type: "string", example: "100.00", description: "商品金额，单位元，支持2位小数" },
        { fieldName: "商品名称", variableName: "pay_productname", required: true, sign: false, type: "string", example: "测试商品", description: "商品名称" },
        { fieldName: "付款人IP", variableName: "pay_ip", required: true, sign: false, type: "string", example: "1.1.1.1", description: "付款玩家的真实IP" },
        { fieldName: "MD5签名", variableName: "pay_md5sign", required: true, sign: false, type: "string", example: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", description: "请看MD5签名字段格式" },
        { fieldName: "附加字段", variableName: "pay_attach", required: false, sign: false, type: "string", example: "USER_001", description: "此字段在返回时按原样返回" },
        { fieldName: "会员ID", variableName: "pay_userid", required: false, sign: false, type: "string", example: "USER_001", description: "付款用户的唯一标识" },
        { fieldName: "付款人姓名", variableName: "pay_username", required: false, sign: false, type: "string", example: "小明", description: "转卡通道或银联通道必须填写" }
      ]
    },
    response: {
      title: "返回参数",
      params: [
        { fieldName: "状态码", variableName: "status", required: true, type: "int", example: "1", description: "1为下单成功，其余状态为下单失败" },
        { fieldName: "状态信息", variableName: "msg", required: true, type: "string", example: "下单成功", description: "下单状态返回的中文显示" },
        { fieldName: "商户订单号", variableName: "order_id", required: true, type: "string", example: "FX20260101001", description: "商户订单号" },
        { fieldName: "平台订单号", variableName: "mch_order_id", required: true, type: "string", example: "FX202601010000001", description: "平台订单号" },
        { fieldName: "支付链接", variableName: "h5_url", required: false, type: "string", example: "https://test.com/payurl", description: "付款链接，请求时请取这个参数" },
        { fieldName: "SDK请求参数", variableName: "sdk_url", required: false, type: "string", example: "", description: "SDK的请求参数" },
        { fieldName: "付款链接", variableName: "pay_url", required: false, type: "string", example: "", description: "若为HTML格式，则取此参数" }
      ]
    }
  },
  {
    name: "订单查询",
    url: "网站地址/Pay_Trade_query.html",
    method: "POST",
    description: "查询订单最新状态与支付结果。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "pay_memberid", required: true, sign: true, type: "string", example: "260505221", description: "平台分配商户号" },
        { fieldName: "订单号", variableName: "pay_orderid", required: true, sign: true, type: "string", example: "FX20260101001", description: "上送订单号唯一，字符长度20" },
        { fieldName: "签名", variableName: "pay_md5sign", required: true, sign: false, type: "string", example: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", description: "签名值" }
      ]
    },
    response: {
      title: "返回参数",
      params: [
        { fieldName: "商户编号", variableName: "memberid", required: true, sign: true, type: "string", example: "260505221", description: "商户编号" },
        { fieldName: "订单号", variableName: "orderid", required: true, sign: true, type: "string", example: "FX20260101001", description: "订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, sign: true, type: "string", example: "100.00", description: "订单金额" },
        { fieldName: "支付成功时间", variableName: "time_end", required: true, sign: true, type: "string", example: "2026-01-01 12:05:00", description: "支付成功时间" },
        { fieldName: "交易流水号", variableName: "transaction_id", required: true, sign: true, type: "string", example: "TXN123456", description: "交易流水号" },
        { fieldName: "请求状态", variableName: "returncode", required: true, sign: true, type: "string", example: "00", description: "00为成功，此状态仅判断请求是否成功" },
        { fieldName: "交易状态", variableName: "trade_state", required: true, sign: true, type: "string", example: "SUCCESS", description: "NOTPAY-未支付 / SUCCESS-已支付" },
        { fieldName: "签名", variableName: "sign", required: true, sign: false, type: "string", example: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", description: "签名值" }
      ]
    }
  },
  {
    name: "余额查询",
    url: "网站地址/Pay_Trade_querymoney.html",
    method: "POST",
    description: "查询商户余额和冻结余额。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "商户号", variableName: "pay_memberid", required: true, sign: true, type: "string", example: "260505221", description: "平台分配商户号" },
        { fieldName: "订单号", variableName: "pay_orderid", required: true, sign: true, type: "string", example: "FX20260101001", description: "上送订单号唯一，字符长度20" },
        { fieldName: "查询时间", variableName: "pay_applydate", required: true, sign: true, type: "string", example: "2026-01-01 12:00:00", description: "查询时间：2022-01-01 00:00:00" },
        { fieldName: "签名", variableName: "pay_md5sign", required: true, sign: false, type: "string", example: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", description: "签名值" }
      ]
    },
    response: {
      title: "返回参数",
      params: [
        { fieldName: "商户编号", variableName: "memberid", required: true, sign: true, type: "string", example: "260505221", description: "商户编号" },
        { fieldName: "订单号", variableName: "orderid", required: true, sign: true, type: "string", example: "FX20260101001", description: "查询订单号" },
        { fieldName: "查询时间", variableName: "time", required: true, sign: true, type: "string", example: "2026-01-01 12:00:00", description: "查询返回时间" },
        { fieldName: "商户余额", variableName: "balance", required: true, sign: true, type: "string", example: "10000.00", description: "商户的可用余额" },
        { fieldName: "冻结余额", variableName: "blockedbalance", required: true, sign: true, type: "string", example: "0.00", description: "商户冻结余额" },
        { fieldName: "签名", variableName: "sign", required: true, sign: false, type: "string", example: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", description: "签名值" }
      ]
    }
  },
  {
    name: "订单回调",
    url: "商户在订单请求中传入 pay_notifyurl",
    method: "POST",
    description: "支付成功后平台向商户发起异步通知，商户需返回 OK。",
    request: {
      title: "通知参数",
      params: [
        { fieldName: "商户编号", variableName: "memberid", required: true, sign: true, type: "string", example: "260505221", description: "商户编号" },
        { fieldName: "订单号", variableName: "orderid", required: true, sign: true, type: "string", example: "FX20260101001", description: "订单号" },
        { fieldName: "订单金额", variableName: "amount", required: true, sign: true, type: "string", example: "100.00", description: "订单金额" },
        { fieldName: "交易流水号", variableName: "transaction_id", required: true, sign: true, type: "string", example: "TXN123456", description: "交易流水号" },
        { fieldName: "交易时间", variableName: "datetime", required: true, sign: true, type: "string", example: "2026-01-01 12:05:00", description: "交易时间" },
        { fieldName: "交易状态", variableName: "returncode", required: true, sign: true, type: "string", example: "00", description: "00为成功" },
        { fieldName: "扩展返回", variableName: "attach", required: false, sign: false, type: "string", example: "USER_001", description: "商户附加数据返回" },
        { fieldName: "签名", variableName: "sign", required: true, sign: false, type: "string", example: "A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6", description: "签名值" }
      ]
    },
    response: {
      title: "商户响应",
      params: [
        { fieldName: "响应体", variableName: "body", required: true, type: "string", example: "OK", description: "返回OK则平台停止重试" }
      ]
    }
  }
];
