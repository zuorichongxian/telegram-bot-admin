# Tasks

- [x] Task 1: 创建前端 API 层（paymentApi7.ts）
  - [ ] 1.1 创建 `web/src/lib/paymentApi7.ts` — 复制 paymentApi5.ts 的类型定义和核心函数，修改默认配置为金安通道参数（商务号260506688、秘钥7pcgb193qvmd0oqmxxrjg4ude5l0cxtf）
  - [ ] 1.2 导出所有必要的类型、配置常量和 API 函数

- [x] Task 2: 创建前端文档层（paymentApi7Docs.ts）
  - [ ] 2.1 创建 `web/src/lib/paymentApi7Docs.ts` — 复制 paymentApi5Docs.ts 的接口文档结构，更新文档标题为"接单测试7 - 金安支付通道"
  - [ ] 2.2 更新商户信息和回调IP等对接信息说明

- [x] Task 3: 创建前端工作区 UI 组件
  - [ ] 3.1 创建 `web/src/workspaces/PaymentTest7Workspace.tsx` — 复制 PaymentTest5Workspace.tsx 的完整UI结构
  - [ ] 3.2 修改组件标题为"接单测试7 - 金安支付通道"
  - [ ] 3.3 在统一下单表单中添加固定面额快捷选项（50、100、200）
  - [ ] 3.4 导入 paymentApi7 的类型和函数替代 paymentApi5

- [x] Task 4: 集成前端路由
  - [ ] 4.1 在 `web/src/App.tsx` 中导入 PaymentTest7Workspace
  - [ ] 4.2 新增"payment7"到 WorkspaceTab 类型定义
  - [ ] 4.3 在 tabs 数组中新增"接单测试7"标签页配置
  - [ ] 4.4 在路由渲染逻辑中添加 payment7 分支

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1] and [Task 2]
- [Task 4] depends on [Task 3]
