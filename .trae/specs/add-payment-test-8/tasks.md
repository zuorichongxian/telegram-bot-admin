# Tasks

- [x] Task 1: 创建后端签名工具和数据库表结构
  - [x] 1.1 创建 `server/src/utils/payment8Sign.ts`，实现签名生成与验证函数
  - [x] 1.2 在 `server/src/db/database.ts` 中新增 `payment8_callbacks` 表及索引

- [x] Task 2: 创建后端服务层和控制器
  - [x] 2.1 创建 `server/src/services/Payment8CallbackService.ts`，实现回调记录的 CRUD 操作
  - [x] 2.2 创建 `server/src/controllers/payment8CallbackController.ts`，实现回调处理、查询、清空逻辑

- [x] Task 3: 创建后端路由层
  - [x] 3.1 创建 `server/src/routes/payment8ProxyRoutes.ts`，配置代理中间件转发到 cdnapi.hnqo.xyz
  - [x] 3.2 创建 `server/src/routes/payment8CallbackRoutes.ts`，定义回调相关路由

- [x] Task 4: 注册后端路由到服务器入口
  - [x] 4.1 修改 `server/src/app.ts`，注册 payment8 路由和代理中间件

- [x] Task 5: 创建前端 API 层
  - [x] 5.1 创建 `web/src/lib/paymentApi8.ts`，包含类型定义、默认配置、API 请求函数（统一下单、订单查询、余额查询、回调记录）

- [x] Task 6: 创建前端文档层
  - [x] 6.1 创建 `web/src/lib/paymentApi8Docs.ts`，定义接口文档数据（接口规则、签名规则、订单状态、API 文档）

- [x] Task 7: 创建前端工作区组件
  - [x] 7.1 创建 `web/src/workspaces/PaymentTest8Workspace.tsx`，实现完整 UI（配置面板、统一下单、订单查询、余额查询、回调记录、操作日志、接口文档）

- [x] Task 8: 配置前端构建和路由
  - [x] 8.1 修改 `web/vite.config.ts`，新增 `/api/payment8-proxy` 和 `/api/payment8` 代理规则
  - [x] 8.2 修改 `web/src/App.tsx`，新增"接单测试8"标签页和路由

- [x] Task 9: 修复支付通道编码下拉选择器（验证发现的问题）
  - [x] 9.1 在 paymentApi8.ts 中添加 PAYMENT8_CHANNELS 常量和 PaymentChannel 类型
  - [x] 9.2 修改 PaymentTest8Workspace.tsx，将支付编码 Input 替换为 Select 下拉组件
  - [x] 9.3 实现通道选择后联动金额选项功能

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] is independent (可并行)
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 5, Task 6]
- [Task 8] depends on [Task 7, Task 4]
