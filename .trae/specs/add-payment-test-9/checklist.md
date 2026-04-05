# 接单测试9 验证清单

> 验证时间：2026-04-05
> 验证结果：**13/13 全部通过** ✅

## 验证结果

- [x] **1. 后端签名工具 `payment9Sign.ts` 实现了 MD5 签名生成与验证功能（首字母排序+首尾拼接secret+MD5大写）**
  - 文件：[payment9Sign.ts](../../server/src/utils/payment9Sign.ts)
  - 导出 `DEFAULT_PAYMENT9_CLIENT_SECRET`（值为 `a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218`）✅
  - 导出 `generatePayment9Sign`（MD5签名生成：排序→keyvalue拼接→首尾加secret→MD5大写）✅
  - 导出 `verifyPayment9Sign`（签名验证）✅

- [x] **2. 数据库 `payment9_callbacks` 表创建成功，包含所有必需字段和索引**
  - 文件：[database.ts](../../server/src/db/database.ts)
  - 表字段完整：id, callbacks, type, total, api_order_sn, order_sn, sign, raw_data, verified, created_at ✅
  - 索引完整：api_order_sn, order_sn, created_at ✅

- [x] **3. `Payment9CallbackService.ts` 实现了回调记录的增删查操作**
  - 文件：[Payment9CallbackService.ts](../../server/src/services/Payment9CallbackService.ts)
  - `create(input)` 方法 ✅
  - `findAll(limit)` 方法 ✅
  - `deleteAll()` 方法 ✅

- [x] **4. `payment9CallbackController.ts` 正确处理回调请求、查询、清空逻辑**
  - 文件：[payment9CallbackController.ts](../../server/src/controllers/payment9CallbackController.ts)
  - `handlePayment9Callback`（POST回调处理+验签，成功返回 'success' 字符串）✅
  - `getPayment9Callbacks`（GET查询列表）✅
  - `clearPayment9Callbacks`（DELETE清空）✅

- [x] **5. `payment9ProxyRoutes.ts` 代理配置正确转发到 47.76.172.252:8083**
  - 文件：[payment9ProxyRoutes.ts](../../server/src/routes/payment9ProxyRoutes.ts)
  - target: "http://47.76.172.252:8083" ✅
  - 包含签名重写逻辑 `rewritePayment9Sign` ✅

- [x] **6. `payment9CallbackRoutes.ts` 路由定义完整（POST callback, GET callbacks, DELETE callbacks）**
  - 文件：[payment9CallbackRoutes.ts](../../server/src/routes/payment9CallbackRoutes.ts)
  - POST `/payment9/callback` ✅
  - GET `/payment9/callbacks` ✅
  - DELETE `/payment9/callbacks` ✅

- [x] **7. `server/src/app.ts` 成功注册 payment9 路由和代理中间件**
  - 文件：[app.ts#L26-L27,L75-L76](../../server/src/app.ts#L26-L27)
  - import payment9CallbackRouter & payment9Proxy ✅
  - `app.use(payment9CallbackRouter)` ✅
  - `app.use("/api/payment9-proxy", payment9Proxy)` ✅

- [x] **8. 前端 `paymentApi9.ts` 包含完整的类型定义、默认配置和 API 函数**
  - 文件：[paymentApi9.ts](../../web/src/lib/paymentApi9.ts)
  - 类型定义：UnifiedOrderResponse（order_sn/api_order_sn/type/h5_url/qr_url）, QueryOrderResponse（order_sn/total/type/is_pay）, Payment9Config 等 ✅
  - `DEFAULT_PAYMENT9_CONFIG.clientId = "d4b8ab0c8bde8263bc0781ebd3b56feb"` ✅
  - `DEFAULT_PAYMENT9_CONFIG.merchantKey = "a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218"` ✅
  - API函数：createUnifiedOrder, queryOrder, fetchPayment9Callbacks, clearPayment9Callbacks ✅

- [x] **9. 前端 `paymentApi9Docs.ts` 包含接口文档数据**
  - 文件：[paymentApi9Docs.ts](../../web/src/lib/paymentApi9Docs.ts)
  - 统一下单接口文档 ✅
  - 查询订单接口文档 ✅
  - 支付通知回调文档（返回 success）✅
  - 签名规则说明（首字母排序→keyvalue拼接→首尾加secret→MD5大写）✅

- [x] **10. 前端 `PaymentTest9Workspace.tsx` UI 组件完整**
  - 文件：[PaymentTest9Workspace.tsx](../../web/src/workspaces/PaymentTest9Workspace.tsx)
  - 配置面板（商户ID/商户秘钥/支付方式alipay/通知地址/代理开关）✅
  - 统一下单（表单+结果展示，显示 h5_url 和 qr_url）✅
  - 订单查询（输入平台订单号 order_sn + 结果展示，显示 is_pay 状态）✅
  - 回调记录（列表+刷新/清空）✅
  - 操作日志（最近100条）✅
  - 接口文档（规则/签名/API选择器）✅

- [x] **11. Vite 配置新增 `/api/payment9-proxy` 和 `/api/payment9` 代理规则**
  - 文件：[vite.config.ts](../../web/vite.config.ts)
  - `/api/payment9-proxy` → `http://localhost:3200`（含 path rewrite）✅
  - `/api/payment9` → `http://localhost:3200` ✅

- [x] **12. App.tsx 新增"接单测试9"标签页和路由配置正确**
  - 文件：[App.tsx](../../web/src/App.tsx)
  - import PaymentTest9Workspace ✅
  - WorkspaceTab 含 "payment9" ✅
  - tabs 定义：label="接单测试9" ✅
  - 渲染：`activeTab === "payment9"` → `<PaymentTest9Workspace />` ✅

- [x] **13. 回调地址自动填充为 `/api/payment9/callback`**
  - 文件：[paymentApi9.ts](../../web/src/lib/paymentApi9.ts)
  - `getDefaultPayment9CallbackUrls()` 返回 `notifyUrl: ${origin}/api/payment9/callback` ✅

---

## 总结

| 类别 | 通过 | 未通过 |
|------|------|--------|
| 后端（签名/数据库/服务/控制器/路由/app注册） | 7/7 | 0 |
| 前端（API/文档/UI/配置/路由/回调地址） | 6/6 | 0 |
| **合计** | **13/13** | **0** |

### ✅ 所有检查项全部通过

"接单测试9"功能已完整实现，包括：
- 完整的后端基础设施（签名工具、数据库表、服务层、控制器、代理路由、回调路由）
- 完整的前端实现（API层、文档层、UI组件）
- 正确的配置和路由注册（Vite代理、App.tsx标签页）
- 独特的签名算法（首字母排序→keyvalue拼接→首尾拼接client_secret→MD5大写）
