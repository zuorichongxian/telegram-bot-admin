export type ApiDocParam = {
  fieldName: string;
  variableName: string;
  required: boolean;
  type: string;
  example: string;
  description: string;
  sign?: boolean;
};

export type ApiDocSection = {
  title: string;
  params: ApiDocParam[];
};

export type ApiDocInterface = {
  name: string;
  url: string;
  method: string;
  description: string;
  request: ApiDocSection;
  response: ApiDocSection;
  dataResponse?: ApiDocSection;
};

// 通用请求参数
export const commonRequestParams: ApiDocParam[] = [
  {
    fieldName: "商户号",
    variableName: "merchantNo",
    required: true,
    type: "String(128)",
    example: "4760774446035387265",
    description: "商户号"
  },
  {
    fieldName: "请求时间戳",
    variableName: "timestamp",
    required: true,
    type: "long(13)",
    example: "1749710334000",
    description: "请求时间戳"
  },
  {
    fieldName: "签名",
    variableName: "sign",
    required: true,
    type: "String(128)",
    example: "C380BEC2BFD727A4B6845133519F3AD6",
    description: "签名值"
  }
];

// 通用响应参数
export const commonResponseParams: ApiDocParam[] = [
  {
    fieldName: "响应状态码",
    variableName: "code",
    required: false,
    type: "string",
    example: "00000",
    description: "00000为成功，其他-处理有误，详见错误码"
  },
  {
    fieldName: "响应信息",
    variableName: "message",
    required: false,
    type: "String(128)",
    example: "处理成功!",
    description: "响应的结果信息"
  },
  {
    fieldName: "返回数据",
    variableName: "data",
    required: false,
    type: "object",
    example: "{}",
    description: "返回响应数据"
  },
  {
    fieldName: "traceId日志排查",
    variableName: "traceId",
    required: false,
    type: "string",
    example: "2025-06-12 14:51:36KdCrbTDYh6tFtQb8 server",
    description: "traceId日志排查"
  }
];

// 代收下单接口
export const collectOrderApiDoc: ApiDocInterface = {
  name: "代收下单",
  url: "https://pay.fykkbb.xyz/order/api/v1/collectOrder/create",
  method: "POST",
  description: "商户业务系统通过统一下单接口发起支付收款订单，支付网关会根据商户配置的支付通道路由支付通道完成支付下单。支付网关根据不同的支付方式返回对应的支付参数，业务系统使用支付参数发起收款。",
  request: {
    title: "请求参数",
    params: [
      ...commonRequestParams,
      {
        fieldName: "通道编码",
        variableName: "channelCode",
        required: true,
        type: "String(128)",
        example: "tdasdfasdf",
        description: "通道编码"
      },
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: true,
        type: "String(128)",
        example: "20160427210604000490",
        description: "商户订单号"
      },
      {
        fieldName: "订单金额",
        variableName: "orderAmount",
        required: true,
        type: "BigDecimal",
        example: "100.00",
        description: "单位为元，精确到小数点后2位"
      },
      {
        fieldName: "异步通知地址",
        variableName: "notifyUrl",
        required: true,
        type: "String",
        example: "https://www.baidu.com/notify.htm",
        description: "支付结果异步回调URL,只有传了该值才会发起回调"
      },
      {
        fieldName: "跳转通知地址",
        variableName: "returnUrl",
        required: false,
        type: "String",
        example: "https://www.baidu.com/return.htm",
        description: "支付结果同步跳转通知URL"
      },
      {
        fieldName: "付款人姓名",
        variableName: "payerName",
        required: false,
        type: "String",
        example: "张三",
        description: "付款人的名称"
      },
      {
        fieldName: "付款人IP",
        variableName: "payerIp",
        required: false,
        type: "String",
        example: "127.0.0.1",
        description: "付款人的IP"
      },
      {
        fieldName: "扩展参数",
        variableName: "extParam",
        required: false,
        type: "String(512)",
        example: "134586944573118714",
        description: "商户扩展参数，字符串或者JSON格式字符串，回调时会原样返回"
      }
    ]
  },
  response: {
    title: "响应参数",
    params: commonResponseParams
  },
  dataResponse: {
    title: "data数据格式",
    params: [
      {
        fieldName: "商户号",
        variableName: "merchantNo",
        required: true,
        type: "String(128)",
        example: "4760774446035387265",
        description: "商户号"
      },
      {
        fieldName: "请求时间戳",
        variableName: "timestamp",
        required: true,
        type: "long(13)",
        example: "1749710334000",
        description: "请求时间戳"
      },
      {
        fieldName: "签名",
        variableName: "sign",
        required: true,
        type: "String",
        example: "6C914BB42578C6C8059BC17B1CEE48DC",
        description: "签名值"
      },
      {
        fieldName: "通道编码",
        variableName: "channelCode",
        required: false,
        type: "string",
        example: "td",
        description: "通道编码"
      },
      {
        fieldName: "系统订单号",
        variableName: "systemOrderNo",
        required: false,
        type: "long",
        example: "4580221161868350593",
        description: "返回订单的系统订单号"
      },
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: false,
        type: "String(128)",
        example: "20160427210604000490",
        description: "返回订单的商户订单号"
      },
      {
        fieldName: "订单金额",
        variableName: "orderAmount",
        required: true,
        type: "BigDecimal",
        example: "100.00",
        description: "单位为元，精确到小数点后2位"
      },
      {
        fieldName: "订单状态",
        variableName: "orderStatus",
        required: true,
        type: "integer",
        example: "0",
        description: "订单状态 0-已生成、1-待接单、2-已接单、3-已成功、4-已取消、5-已超时、6-高危订单、7-渠道订单失败、8-匹配失败"
      },
      {
        fieldName: "支付链接",
        variableName: "payUrl",
        required: false,
        type: "String",
        example: "https://pay.example.com/...",
        description: "支付链接"
      },
      {
        fieldName: "二维码链接",
        variableName: "qrCodeUrl",
        required: false,
        type: "String",
        example: "https://pay.example.com/qr/...",
        description: "二维码链接"
      }
    ]
  }
};

// 代收订单查询接口
export const collectOrderQueryApiDoc: ApiDocInterface = {
  name: "代收订单查询",
  url: "https://pay.fykkbb.xyz/order/api/v1/collectOrder/queryCollectOrder",
  method: "POST",
  description: "查询代收订单的状态和详细信息。",
  request: {
    title: "请求参数",
    params: [
      ...commonRequestParams,
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: true,
        type: "String(128)",
        example: "20160427210604000490",
        description: "商户订单号"
      }
    ]
  },
  response: {
    title: "响应参数",
    params: commonResponseParams
  },
  dataResponse: {
    title: "data数据格式",
    params: [
      {
        fieldName: "商户号",
        variableName: "merchantNo",
        required: true,
        type: "String(128)",
        example: "4760774446035387265",
        description: "商户号"
      },
      {
        fieldName: "系统订单号",
        variableName: "systemOrderNo",
        required: false,
        type: "long",
        example: "4580221161868350593",
        description: "系统订单号"
      },
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: true,
        type: "String(128)",
        example: "20160427210604000490",
        description: "商户订单号"
      },
      {
        fieldName: "订单金额",
        variableName: "orderAmount",
        required: true,
        type: "BigDecimal",
        example: "100.00",
        description: "单位为元，精确到小数点后2位"
      },
      {
        fieldName: "订单状态",
        variableName: "orderStatus",
        required: true,
        type: "integer",
        example: "3",
        description: "订单状态 0-已生成、1-待接单、2-已接单、3-已成功、4-已取消、5-已超时、6-高危订单、7-渠道订单失败、8-匹配失败"
      },
      {
        fieldName: "创建时间",
        variableName: "createdAt",
        required: false,
        type: "string",
        example: "2025-06-12 14:51:36",
        description: "订单创建时间"
      },
      {
        fieldName: "支付时间",
        variableName: "paidAt",
        required: false,
        type: "string",
        example: "2025-06-12 14:52:10",
        description: "订单支付时间"
      }
    ]
  }
};

// 代付下单接口
export const paymentOrderApiDoc: ApiDocInterface = {
  name: "代付下单",
  url: "https://pay.fykkbb.xyz/order/api/v1/paymentOrder/create",
  method: "POST",
  description: "商户业务系统通过代付下单接口发起付款订单，支付网关会根据商户配置的支付通道路由支付通道完成付款下单。",
  request: {
    title: "请求参数",
    params: [
      ...commonRequestParams,
      {
        fieldName: "通道编码",
        variableName: "channelCode",
        required: true,
        type: "String(128)",
        example: "tdasdfasdf",
        description: "通道编码"
      },
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: true,
        type: "String(128)",
        example: "20160427210604000490",
        description: "商户订单号"
      },
      {
        fieldName: "订单金额",
        variableName: "orderAmount",
        required: true,
        type: "BigDecimal",
        example: "100.00",
        description: "单位为元，精确到小数点后2位"
      },
      {
        fieldName: "异步通知地址",
        variableName: "notifyUrl",
        required: true,
        type: "String",
        example: "https://www.baidu.com/notify.htm",
        description: "支付结果异步回调URL,只有传了该值才会发起回调"
      },
      {
        fieldName: "跳转通知地址",
        variableName: "returnUrl",
        required: false,
        type: "String",
        example: "https://www.baidu.com/return.htm",
        description: "支付结果同步跳转通知URL"
      },
      {
        fieldName: "收款账号",
        variableName: "payeeAccountNo",
        required: true,
        type: "String",
        example: "6222021234567890123",
        description: "收款人银行账号或其他收款账号"
      },
      {
        fieldName: "收款人姓名",
        variableName: "payeeAccountName",
        required: false,
        type: "String",
        example: "张三",
        description: "收款人姓名"
      },
      {
        fieldName: "银行编码",
        variableName: "payeeBankCode",
        required: false,
        type: "String",
        example: "ICBC",
        description: "银行编码"
      },
      {
        fieldName: "扩展参数",
        variableName: "extParam",
        required: false,
        type: "String(512)",
        example: "134586944573118714",
        description: "商户扩展参数，字符串或者JSON格式字符串，回调时会原样返回"
      }
    ]
  },
  response: {
    title: "响应参数",
    params: commonResponseParams
  },
  dataResponse: {
    title: "data数据格式",
    params: [
      {
        fieldName: "商户号",
        variableName: "merchantNo",
        required: true,
        type: "String(128)",
        example: "4760774446035387265",
        description: "商户号"
      },
      {
        fieldName: "请求时间戳",
        variableName: "timestamp",
        required: true,
        type: "long(13)",
        example: "1749710334000",
        description: "请求时间戳"
      },
      {
        fieldName: "签名",
        variableName: "sign",
        required: true,
        type: "String",
        example: "6C914BB42578C6C8059BC17B1CEE48DC",
        description: "签名值"
      },
      {
        fieldName: "系统订单号",
        variableName: "systemOrderNo",
        required: false,
        type: "long",
        example: "4580221161868350593",
        description: "返回订单的系统订单号"
      },
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: false,
        type: "String(128)",
        example: "20160427210604000490",
        description: "返回订单的商户订单号"
      },
      {
        fieldName: "订单金额",
        variableName: "orderAmount",
        required: true,
        type: "BigDecimal",
        example: "100.00",
        description: "单位为元，精确到小数点后2位"
      },
      {
        fieldName: "订单状态",
        variableName: "orderStatus",
        required: true,
        type: "integer",
        example: "0",
        description: "订单状态 0-已生成、1-待接单、2-已接单、3-已成功、4-已取消、5-已超时、6-高危订单、7-渠道订单失败、8-匹配失败"
      }
    ]
  }
};

// 代付订单查询接口
export const paymentOrderQueryApiDoc: ApiDocInterface = {
  name: "代付订单查询",
  url: "https://pay.fykkbb.xyz/order/api/v1/paymentOrder/queryPaymentOrder",
  method: "POST",
  description: "查询代付订单的状态和详细信息。",
  request: {
    title: "请求参数",
    params: [
      ...commonRequestParams,
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: true,
        type: "String(128)",
        example: "20160427210604000490",
        description: "商户订单号"
      }
    ]
  },
  response: {
    title: "响应参数",
    params: commonResponseParams
  },
  dataResponse: {
    title: "data数据格式",
    params: [
      {
        fieldName: "商户号",
        variableName: "merchantNo",
        required: true,
        type: "String(128)",
        example: "4760774446035387265",
        description: "商户号"
      },
      {
        fieldName: "系统订单号",
        variableName: "systemOrderNo",
        required: false,
        type: "long",
        example: "4580221161868350593",
        description: "系统订单号"
      },
      {
        fieldName: "商户订单号",
        variableName: "merchantOrderNo",
        required: true,
        type: "String(128)",
        example: "20160427210604000490",
        description: "商户订单号"
      },
      {
        fieldName: "订单金额",
        variableName: "orderAmount",
        required: true,
        type: "BigDecimal",
        example: "100.00",
        description: "单位为元，精确到小数点后2位"
      },
      {
        fieldName: "订单状态",
        variableName: "orderStatus",
        required: true,
        type: "integer",
        example: "3",
        description: "订单状态 0-已生成、1-待接单、2-已接单、3-已成功、4-已取消、5-已超时、6-高危订单、7-渠道订单失败、8-匹配失败"
      },
      {
        fieldName: "创建时间",
        variableName: "createdAt",
        required: false,
        type: "string",
        example: "2025-06-12 14:51:36",
        description: "订单创建时间"
      },
      {
        fieldName: "支付时间",
        variableName: "paidAt",
        required: false,
        type: "string",
        example: "2025-06-12 14:52:10",
        description: "订单支付时间"
      }
    ]
  }
};

// 商户信息查询接口
export const merchantInfoApiDoc: ApiDocInterface = {
  name: "商户信息查询",
  url: "https://pay.fykkbb.xyz/order/api/v1/merchant",
  method: "POST",
  description: "查询商户的基本信息、余额和状态。",
  request: {
    title: "请求参数",
    params: commonRequestParams
  },
  response: {
    title: "响应参数",
    params: commonResponseParams
  },
  dataResponse: {
    title: "data数据格式",
    params: [
      {
        fieldName: "商户号",
        variableName: "merchantNo",
        required: true,
        type: "String(128)",
        example: "4760774446035387265",
        description: "商户号"
      },
      {
        fieldName: "商户名称",
        variableName: "merchantName",
        required: false,
        type: "String",
        example: "测试商户",
        description: "商户名称"
      },
      {
        fieldName: "账户余额",
        variableName: "balance",
        required: false,
        type: "BigDecimal",
        example: "10000.00",
        description: "商户账户余额"
      },
      {
        fieldName: "冻结余额",
        variableName: "frozenBalance",
        required: false,
        type: "BigDecimal",
        example: "0.00",
        description: "冻结余额"
      },
      {
        fieldName: "状态",
        variableName: "status",
        required: false,
        type: "integer",
        example: "1",
        description: "商户状态"
      },
      {
        fieldName: "状态描述",
        variableName: "statusDesc",
        required: false,
        type: "String",
        example: "正常",
        description: "状态描述"
      },
      {
        fieldName: "创建时间",
        variableName: "createdAt",
        required: false,
        type: "string",
        example: "2025-01-01 00:00:00",
        description: "商户创建时间"
      }
    ]
  }
};

// 所有接口文档列表
export const allApiDocs: ApiDocInterface[] = [
  collectOrderApiDoc,
  collectOrderQueryApiDoc,
  paymentOrderApiDoc,
  paymentOrderQueryApiDoc,
  merchantInfoApiDoc
];

// 订单状态映射
export const orderStatusDoc = [
  { code: 0, desc: "已生成" },
  { code: 1, desc: "待接单" },
  { code: 2, desc: "已接单" },
  { code: 3, desc: "已成功" },
  { code: 4, desc: "已取消" },
  { code: 5, desc: "已超时" },
  { code: 6, desc: "高危订单" },
  { code: 7, desc: "渠道订单失败" },
  { code: 8, desc: "匹配失败" }
];

// 签名算法说明
export const signAlgorithmDoc = {
  title: "签名算法",
  description: "签名生成的通用步骤如下：",
  steps: [
    {
      step: 1,
      title: "参数排序",
      content: "设所有发送或者接收到的数据为集合M，将集合M内非空参数值的参数按照参数名ASCII码从小到大排序（字典序），使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串stringA。",
      rules: [
        "参数名ASCII码从小到大排序（字典序）",
        "如果参数的值为空不参与签名",
        "参数名区分大小写",
        "验证调用返回或支付中心主动通知签名时，传送的sign参数不参与签名，将生成的签名与该sign值作校验"
      ]
    },
    {
      step: 2,
      title: "生成签名",
      content: "在stringA最后拼接上key [即 StringA +\"&key=\" + 私钥 ] 得到stringSignTemp字符串，并对stringSignTemp进行MD5运算，再将得到的字符串所有字符转换为大写，得到sign值signValue。"
    }
  ],
  example: {
    params: {
      channelCode: "1001",
      merchantOrderNo: "QlJPKSymSC2O",
      orderAmount: "50.00",
      merchantNo: "abcd",
      notifyUrl: "https://www.baidu.com",
      extParam: "",
      timeStamp: "1234567891011"
    },
    stringA: "channelCode=1001&merchantOrderNo=QlJPKSymSC2O&orderAmount=50.00&merchantNo=abcd&notifyUrl=https://www.baidu.com&extParam=''&timeStamp=1234567891011",
    stringSignTemp: "channelCode=1001&merchantOrderNo=QlJPKSymSC2O&orderAmount=50.00&merchantNo=abcd&notifyUrl=https://www.baidu.com&extParam=''&timeStamp=1234567891011&key=sxedcrfvtgbujm",
    signValue: "1689B66D95B7CBB92A77A337BE59AAB1"
  }
};

// 接口规则
export const apiRulesDoc = {
  title: "接口规则",
  rules: [
    { name: "传输方式", value: "HTTPS" },
    { name: "提交方式", value: "POST" },
    { name: "内容类型", value: "application/json" },
    { name: "字符编码", value: "UTF-8" },
    { name: "签名算法", value: "MD5" },
    { name: "超时时间", value: "60秒" }
  ],
  paramRules: [
    { name: "交易金额", desc: "默认为人民币交易，单位为元，保留到小数点后2位" }
  ]
};
