# 支付回调通知功能任务清单

## 任务列表

### 1. 后端 - 创建回调数据模型和存储
- [x] 1.1 创建 `server/src/db/paymentCallbackSchema.ts` 定义回调数据结构
- [x] 1.2 在 `server/src/db/database.ts` 中添加回调记录表初始化
- [x] 1.3 创建 `server/src/services/PaymentCallbackService.ts` 服务层

### 2. 后端 - 创建回调路由和控制器
- [x] 2.1 创建 `server/src/controllers/paymentCallbackController.ts` 控制器
- [x] 2.2 创建 `server/src/routes/paymentCallbackRoutes.ts` 路由
- [x] 2.3 在 `server/src/app.ts` 中注册路由

### 3. 后端 - 实现签名验证逻辑
- [x] 3.1 创建 `server/src/utils/paymentSign.ts` 签名验证工具
- [x] 3.2 实现回调签名验证函数

### 4. 前端 - 创建支付结果页面
- [x] 4.1 创建 `web/src/pages/PaymentResultPage.tsx` 页面组件
- [x] 4.2 在 `web/src/App.tsx` 中添加路由支持

### 5. 前端 - 更新默认配置
- [x] 5.1 更新 `web/src/lib/paymentApi.ts` 的 DEFAULT_CONFIG
- [x] 5.2 添加获取当前项目地址的函数

### 6. 前端 - 展示回调记录
- [x] 6.1 在 PaymentTestWorkspace 中添加回调记录展示区域
- [x] 6.2 实现回调记录查询和刷新功能
- [x] 6.3 添加自动填充回调地址按钮

### 7. 测试和验证
- [x] 7.1 验证后端回调接口可访问
- [x] 7.2 验证签名验证逻辑正确
- [x] 7.3 验证前端支付结果页面展示
- [x] 7.4 验证回调记录展示功能

## 任务依赖关系

```
1.1 -> 1.2 -> 1.3
2.1 -> 2.2 -> 2.3
3.1 -> 3.2 -> 2.1
4.1 -> 4.2
5.1 -> 5.2 -> 6.3
6.1 -> 6.2
7.* (在 1-6 完成后执行)
```

## 预估工作量

| 任务 | 预估复杂度 |
|------|-----------|
| 1. 创建回调数据模型和存储 | 中 |
| 2. 创建回调路由和控制器 | 中 |
| 3. 实现签名验证逻辑 | 中 |
| 4. 创建支付结果页面 | 低 |
| 5. 更新默认配置 | 低 |
| 6. 展示回调记录 | 中 |
| 7. 测试和验证 | 中 |
