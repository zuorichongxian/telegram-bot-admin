# 接单测试9 验证清单

- [ ] 后端签名工具 `payment9Sign.ts` 实现了 MD5 签名生成与验证功能（首字母排序+首尾拼接secret+MD5大写）
  - 导出 `DEFAULT_PAYMENT9_CLIENT_SECRET`（值为 `a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218`）
  - 导出 `generatePayment9Sign`（MD5签名生成：排序→拼接→首尾加secret→MD5大写）
  - 导出 `verifyPayment9Sign`（签名验证）

- [ ] 数据库 `payment9_callbacks` 表创建成功，包含所有必需字段和索引
  - 表字段完整：id, callbacks, type, total, api_order_sn, order_sn, sign, raw_data, verified, created_at
  - 索引完整：api_order_sn, order_sn, created_at

- [ ] `Payment9CallbackService.ts` 实现了回调记录的增删查操作
  - `create(input)` 方法
  - `findAll(limit)` 方法
  - `deleteAll()` 方法

- [ ] `payment9CallbackController.ts` 正确处理回调请求、查询、清空逻辑
  - `handlePayment9Callback`（POST回调处理+验签，成功返回 'success' 字符串）
  - `getPayment9Callbacks`（GET查询列表）
  - `clearPayment9Callbacks`（DELETE清空）

- [ ] `payment9ProxyRoutes.ts` 代理配置正确转发到 47.76.172.252:8083
  - target: "http://47.76.172.252:8083"

- [ ] `payment9CallbackRoutes.ts` 路由定义完整（POST callback, GET callbacks, DELETE callbacks）

- [ ] `server/src/app.ts` 成功注册 payment9 路由和代理中间件
  - import payment9CallbackRouter & payment9Proxy
  - `app.use(payment9CallbackRouter)`
  - `app.use("/api/payment9-proxy", payment9Proxy)`

- [ ] 前端 `paymentApi9.ts` 包含完整的类型定义、默认配置和 API 函数
  - 类型定义：UnifiedOrderResponse（order_sn/api_order_sn/type/h5_url/qr_url）, QueryOrderResponse（order_sn/total/type/is_pay）, Payment9Config 等
  - `DEFAULT_PAYMENT9_CONFIG.clientId = "d4b8ab0c8bde8263bc0781ebd3b56feb"`
  - `DEFAULT_PAYMENT9_CONFIG.merchantKey = "a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218"`
  - API函数：createUnifiedOrder（POST /index/api/order.html，参数 type/total/api_order_sn/notify_url/client_id/timestamp/sign）, queryOrder（POST /index/api/queryorder.html，参数 order_sn/client_id/timestamp/sign）, fetchPayment9Callbacks, clearPayment9Callbacks

- [ ] 前端 `paymentApi9Docs.ts` 包含接口文档数据
  - 统一下单接口文档（type/total/api_order_sn/notify_url/client_id/timestamp/sign）
  - 查询订单接口文档（order_sn/client_id/timestamp/sign）
  - 支付通知回调文档（callbacks/type/total/api_order_sn/order_sn/sign，返回 success）
  - 签名规则说明（首字母排序→拼接→首尾加secret→MD5大写）

- [ ] 前端 `PaymentTest9Workspace.tsx` UI 组件完整
  - 配置面板（商户ID/商户秘钥/支付方式(alipay)/通知地址/代理开关）
  - 统一下单（表单+结果展示，显示 h5_url 和 qr_url）
  - 订单查询（输入平台订单号 order_sn + 结果展示，显示 is_pay 状态）
  - 回调记录（列表+刷新/清空）
  - 操作日志（最近100条）
  - 接口文档（规则/签名/API选择器）

- [ ] Vite 配置新增 `/api/payment9-proxy` 和 `/api/payment9` 代理规则

- [ ] App.tsx 新增"接单测试9"标签页和路由配置正确
  - import PaymentTest9Workspace
  - WorkspaceTab 含 "payment9"
  - tabs 定义：label="接单测试9"
  - 渲染：`activeTab === "payment9"` → `<PaymentTest9Workspace />`

- [ ] 回调地址自动填充为 `/api/payment9/callback`
