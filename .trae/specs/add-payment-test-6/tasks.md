# Tasks

- [x] Task 1: 创建后端基础设施（签名工具 + 回调服务 + 数据库表）
  - [x] 1.1 创建 `server/src/utils/payment6Sign.ts`，导出 DEFAULT_PAYMENT6_MERCHANT_KEY 和 verifyPayment6Sign
  - [x] 1.2 创建 `server/src/services/Payment6CallbackService.ts`，定义 Payment6Callback 类型及 CRUD 操作（基于 payment6_callbacks 表）
  - [x] 1.3 在数据库初始化中创建 `payment6_callbacks` 表（参考 payment2_callbacks 表结构）

- [x] Task 2: 创建后端路由层（代理 + 回调）
  - [x] 2.1 创建 `server/src/routes/payment6ProxyRoutes.ts`，代理转发至 https://jkapi-wansheng.douyaya.com，重写签名
  - [x] 2.2 创建 `server/src/controllers/payment6CallbackController.ts`，实现回调接收、验签、记录、查询、清空
  - [x] 2.3 创建 `server/src/routes/payment6CallbackRoutes.ts`，挂载 /payment6/callback 路由

- [x] Task 3: 注册后端路由到 app.ts
  - [x] 3.1 在 `server/src/app.ts` 中 import 并注册 payment6CallbackRouter 和 payment6Proxy

- [x] Task 4: 创建前端 API 层
  - [x] 4.1 创建 `web/src/lib/paymentApi6.ts`，包含类型定义、配置、createUnifiedOrder/queryOrder/queryBalance 等函数（复用 paymentApi 的签名工具）

- [x] Task 5: 创建前端文档层
  - [x] 5.1 创建 `web/src/lib/paymentApi6Docs.ts`，定义万盛通道的接口文档数据（统一下单、查询订单、余额查询、支付通知）

- [x] Task 6: 创建前端工作区组件
  - [x] 6.1 创建 `web/src/workspaces/PaymentTest6Workspace.tsx`，完整复制 PaymentTest2Workspace 的 UI 结构和交互逻辑，替换为 payment6 的配置和 API

- [x] Task 7: 集成到前端 App
  - [x] 7.1 在 `web/src/App.tsx` 中新增 payment6 Tab 导航和路由渲染

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] 无依赖（可并行）
- [Task 5] 无依赖（可并行）
- [Task 6] depends on [Task 4, Task 5]
- [Task 7] depends on [Task 6]
