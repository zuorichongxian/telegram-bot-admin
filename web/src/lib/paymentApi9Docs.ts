import type { ApiDocInterface, ApiDocParam } from "./paymentApiDocs";

const commonResponseParams: ApiDocParam[] = [
  {
    fieldName: "返回状态码",
    variableName: "code",
    required: true,
    type: "int",
    example: "200",
    description: "网关返回码：200=成功"
  },
  {
    fieldName: "返回状态",
    variableName: "status",
    required: true,
    type: "int",
    example: "1",
    description: "1=成功"
  },
  {
    fieldName: "返回信息",
    variableName: "msg",
    required: true,
    type: "string",
    example: "下单成功",
    description: "具体提示信息"
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

export const payment9InterfaceRules = [
  { name: "请求方式", value: "POST / form-urlencoded" },
  { name: "字符编码", value: "UTF-8" },
  { name: "金额单位", value: "元（整数）" },
  { name: "签名算法", value: "MD5，32位大写" }
];

export const payment9OrderStates = [
  { code: "0", desc: "未支付" },
  { code: "1", desc: "已支付" }
];

export const payment9CallbackStatuses = [
  { code: "CODE_SUCCESS", desc: "支付成功" },
  { code: "CODE_FAILURE", desc: "支付失败" }
];

export const payment9SignRules = [
  "所有参数按照参数名首字母先后顺序排列。",
  "把排序后的结果按照 参数名+参数值 的方式拼接（无分隔符，如 age1client_idxxxnameaaatimestamp1557229583621）。",
  "拼装好的字符串首尾拼接 client_secret。",
  "对拼接结果进行 MD5 加密后转大写。",
  "空值和空字符串不参与签名。",
  "sign 字段本身不参与签名。"
];

export const payment9ApiDocs: ApiDocInterface[] = [
  {
    name: "统一下单",
    url: "http://47.76.172.252:8083/index/api/order.html",
    method: "POST",
    description: "发起支付收款订单，网关返回 h5_url 和 qr_url 支付链接。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "支付方式", variableName: "type", required: true, type: "string", example: "alipay", description: "支付方式" },
        { fieldName: "支付额度", variableName: "total", required: true, type: "integer", example: "10", description: "支付额度（单位元）" },
        { fieldName: "客户端订单编号", variableName: "api_order_sn", required: true, type: "string", example: "", description: "调用方提供的订单编号，用于回调通知" },
        { fieldName: "回调地址", variableName: "notify_url", required: true, type: "string", example: "", description: "用户支付成功回调地址" },
        { fieldName: "商户 ID", variableName: "client_id", required: true, type: "string", example: "", description: "商户 id" },
        { fieldName: "时间戳", variableName: "timestamp", required: true, type: "string", example: "", description: "13位时间戳" },
        { fieldName: "签名算法", variableName: "sign", required: true, type: "string", example: "", description: "签名算法" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "平台订单编号", variableName: "order_sn", required: false, type: "string", example: "", description: "平台订单编号" },
        { fieldName: "客户端订单编号", variableName: "api_order_sn", required: false, type: "string", example: "", description: "客户端订单编号" },
        { fieldName: "支付方式", variableName: "type", required: false, type: "string", example: "", description: "支付方式" },
        { fieldName: "H5 支付链接", variableName: "h5_url", required: false, type: "string", example: "", description: "h5 支付链接" },
        { fieldName: "二维码支付链接", variableName: "qr_url", required: false, type: "string", example: "", description: "二维码支付链接" }
      ]
    }
  },
  {
    name: "查询订单",
    url: "http://47.76.172.252:8083/index/api/queryorder.html",
    method: "POST",
    description: "使用平台订单号查询订单最新状态与支付结果。",
    request: {
      title: "请求参数",
      params: [
        { fieldName: "平台订单编号", variableName: "order_sn", required: true, type: "string", example: "", description: "平台订单编号" },
        { fieldName: "商户 ID", variableName: "client_id", required: true, type: "string", example: "", description: "商户 id" },
        { fieldName: "时间戳", variableName: "timestamp", required: true, type: "string", example: "", description: "时间戳" },
        { fieldName: "签名算法", variableName: "sign", required: true, type: "string", example: "", description: "签名算法" }
      ]
    },
    response: {
      title: "返回参数",
      params: commonResponseParams
    },
    dataResponse: {
      title: "data 结构",
      params: [
        { fieldName: "平台订单编号", variableName: "order_sn", required: false, type: "string", example: "", description: "平台订单编号" },
        { fieldName: "支付金额", variableName: "total", required: false, type: "string/int", example: "", description: "支付金额" },
        { fieldName: "支付方式", variableName: "type", required: false, type: "string", example: "", description: "支付方式" },
        { fieldName: "是否支付", variableName: "is_pay", required: false, type: "string", example: "", description: "是否支付 0否 1是" }
      ]
    }
  },
  {
    name: "支付通知",
    url: "商户在统一下单中传入的 notify_url",
    method: "POST",
    description: "用户支付成功后，平台向商户 notify_url 发起异步通知。接收成功必须返回字符串 'success'。",
    request: {
      title: "通知参数",
      params: [
        { fieldName: "状态值", variableName: "callbacks", required: true, type: "string", example: "CODE_SUCCESS", description: "状态值：CODE_SUCCESS 成功，CODE_FAILURE 失败" },
        { fieldName: "支付方式", variableName: "type", required: true, type: "string", example: "wechat/alipay", description: "支付方式" },
        { fieldName: "支付总额", variableName: "total", required: true, type: "string", example: "100", description: "支付总额" },
        { fieldName: "客户端订单编号", variableName: "api_order_sn", required: true, type: "string", example: "", description: "客户端订单编号" },
        { fieldName: "平台订单编号", variableName: "order_sn", required: true, type: "string", example: "", description: "平台订单编号" },
        { fieldName: "签名算法", variableName: "sign", required: true, type: "string", example: "", description: "签名算法" }
      ]
    },
    response: {
      title: "商户响应",
      params: [
        { fieldName: "响应体", variableName: "body", required: true, type: "string", example: "success", description: "返回 success 字符串则回调成功" }
      ]
    }
  }
];
