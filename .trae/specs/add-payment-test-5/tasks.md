# Tasks

- [x] Task 1: 创建后端签名工具和数据库层
  - [x] 1.1 创建 `server/src/utils/payment5Sign.ts` — 签名生成与验证函数（MD5，复用 paymentSign 的 sortParams）
  - [x] 1.2 在 `server/src/db/database.ts` 中新增 `payment5_callbacks` 表建表语句和索引

- [x] Task 2: 创建后端服务层、控制器和路由
  - [x] 2.1 创建 `server/src/services/Payment5CallbackService.ts` — 回调数据 CRUD 服务
  - [x] 2.2 创建 `server/src/controllers/payment5CallbackController.ts` — 回调处理/查询/清空控制器
  - [x] 2.3 创建 `server/src/routes/payment5CallbackRoutes.ts` — Express 回调路由（POST callback, GET callbacks, DELETE callbacks）
  - [x] 2.4 创建 `server/src/routes/payment5ProxyRoutes.ts` — 代理中间件（转发到 hh74.fanxingpay.sgjtpay.com，重写签名）

- [x] Task 3: 注册后端路由到服务器入口
  - [x] 3.1 在 `server/src/app.ts` 中导入并注册 payment5 路由和代理

- [x] Task 4: 创建前端 API 层
  - [x] 4.1 创建 `web/src/lib/paymentApi5.ts` — 类型定义、默认配置（商务号260505221、秘钥）、API 函数（下单、查单、余额查询、回调管理）

- [x] Task 5: 创建前端文档层
  - [x] 5.1 创建 `web/src/lib/paymentApi5Docs.ts` — 静态接口文档（接口规则、签名规则、订单状态、API 文档条目）

- [x] Task 6: 创建前端工作区 UI 组件
  - [x] 6.1 创建 `web/src/workspaces/PaymentTest5Workspace.tsx` — 完整 UI 工作区（标题"拉单测试5"、配置面板、统一下单表单、查询订单表单、余额查询、回调记录列表、操作日志、接口文档面板）

- [x] Task 7: 集成前端路由和构建配置
  - [x] 7.1 在 `web/src/App.tsx` 中导入 PaymentTest5Workspace，新增"接单测试5"标签页和路由
  - [x] 7.2 在 `web/vite.config.ts` 中新增 `/api/payment5-proxy` 和 `/api/payment5` 的 Vite 代理规则

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 1] (签名工具共享逻辑)
- [Task 5] depends on [Task 4] (文档依赖类型)
- [Task 6] depends on [Task 4] and [Task 5]
- [Task 7] depends on [Task 6]
