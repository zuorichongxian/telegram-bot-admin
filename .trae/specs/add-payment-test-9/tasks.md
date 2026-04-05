# Tasks

- [ ] Task 1: 创建后端签名工具和数据库表结构
  - [ ] 1.1 创建 `server/src/utils/payment9Sign.ts`，实现签名生成与验证函数（首字母排序+首尾拼接secret+MD5大写）
  - [ ] 1.2 在 `server/src/db/database.ts` 中新增 `payment9_callbacks` 表及索引

- [ ] Task 2: 创建后端服务层和控制器
  - [ ] 2.1 创建 `server/src/services/Payment9CallbackService.ts`，实现回调记录的 CRUD 操作
  - [ ] 2.2 创建 `server/src/controllers/payment9CallbackController.ts`，实现回调处理、查询、清空逻辑（回调成功返回 'success'）

- [ ] Task 3: 创建后端路由层
  - [ ] 3.1 创建 `server/src/routes/payment9ProxyRoutes.ts`，配置代理中间件转发到 47.76.172.252:8083
  - [ ] 3.2 创建 `server/src/routes/payment9CallbackRoutes.ts`，定义回调相关路由

- [ ] Task 4: 注册后端路由到服务器入口
  - [ ] 4.1 修改 `server/src/app.ts`，注册 payment9 路由和代理中间件

- [ ] Task 5: 创建前端 API 层
  - [ ] 5.1 创建 `web/src/lib/paymentApi9.ts`，包含类型定义、默认配置（client_id/secret/alipay通道）、API 请求函数（统一下单、订单查询、回调记录）

- [ ] Task 6: 创建前端文档层
  - [ ] 6.1 创建 `web/src/lib/paymentApi9Docs.ts`，定义接口文档数据（统一下单、查询订单、支付通知三个接口文档、签名规则说明）

- [ ] Task 7: 创建前端工作区组件
  - [ ] 7.1 创建 `web/src/workspaces/PaymentTest9Workspace.tsx`，实现完整 UI（配置面板、统一下单、订单查询、回调记录、操作日志、接口文档），参考 PaymentTest2Workspace.tsx 结构

- [ ] Task 8: 配置前端构建和路由
  - [ ] 8.1 修改 `web/vite.config.ts`，新增 `/api/payment9-proxy` 和 `/api/payment9` 代理规则
  - [ ] 8.2 修改 `web/src/App.tsx`，新增"接单测试9"标签页和路由

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] is independent (可并行)
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 5, Task 6]
- [Task 8] depends on [Task 7, Task 4]
