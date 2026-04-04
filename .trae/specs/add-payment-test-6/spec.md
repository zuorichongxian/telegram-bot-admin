# 拉单测试6（金安/万盛通道）Spec

## Why
需要新增「拉单测试6」支付测试面板，对接金科支付的**万盛（wansheng）通道**（商户名：金安），复用拉单测试2的全部功能模式（统一下单、订单查询、余额查询、回调记录、操作日志、静态文档），仅更换商户配置和 API 域名。

## What Changes
- 新增前端 API 层：`web/src/lib/paymentApi6.ts`（参考 paymentApi2.ts 结构）
- 新增前端文档层：`web/src/lib/paymentApi6Docs.ts`
- 新增前端工作区：`web/src/workspaces/PaymentTest6Workspace.tsx`
- 新增后端签名工具：`server/src/utils/payment6Sign.ts`
- 新增后端代理路由：`server/src/routes/payment6ProxyRoutes.ts`
- 新增后端回调路由：`server/src/routes/payment6CallbackRoutes.ts`
- 新增后端回调控制器：`server/src/controllers/payment6CallbackController.ts`
- 新增后端回调服务：`server/src/services/Payment6CallbackService.ts`
- **修改** `server/src/app.ts`：注册 payment6 代理和回调路由
- **修改** `web/src/App.tsx`：新增 payment6 Tab 和路由

## Impact
- Affected specs: 无（独立新模块）
- Affected code: app.ts, App.tsx 及上述全部新建文件

## ADDED Requirements

### Requirement: 拉单测试6 完整功能
系统 SHALL 提供与拉单测试2完全对等的金安/万盛通道支付测试能力，包含以下子功能：

#### Scenario: 统一下单
- **WHEN** 用户在配置面板填写商户号、密钥、编码等参数后提交下单表单
- **THEN** 系统调用 `https://jkapi-wansheng.douyaya.com/api/v1/pay/unifiedOrder` 发起 POST JSON 请求，返回支付链接和订单信息

#### Scenario: 订单查询
- **WHEN** 用户输入商户订单号并提交查询
- **THEN** 系统调用 `https://jkapi-wansheng.douyaya.com/api/v1/pay/queryOrder` 返回订单最新状态

#### Scenario: 余额查询
- **WHEN** 用户点击余额查询按钮
- **THEN** 系统调用余额查询接口返回商户余额信息

#### Scenario: 回调接收与验签
- **WHEN** 万盛支付网关向 `/api/payment6/callback` 发起异步通知
- **THEN** 后端使用 MD5 签名算法验证签名，记录回调数据到 `payment6_callbacks` 表，返回 SUCCESS

#### Scenario: 回调记录查看与清空
- **WHEN** 用户在前端查看或清空回调记录
- **THEN** 通过 `/api/payment6/callbacks` GET/DELETE 接口操作

#### Scenario: 本地代理转发
- **WHEN** 用户开启代理模式发起请求
- **THEN** 请求经由 `/api/payment6-proxy` 转发至 `https://jkapi-wansheng.douyaya.com`，后端重写签名

#### Scenario: 静态文档展示
- **WHEN** 用户查看接口文档面板
- **THEN** 展示万盛通道的接口字段说明、签名规则和状态码说明

### 对接参数（固定默认值）
| 参数 | 值 |
|------|-----|
| 商户名称 | 金安 |
| 商户后台 | https://jkmch-wansheng.douyaya.com |
| 下单接口 | https://jkapi-wansheng.douyaya.com/api/v1/pay/unifiedOrder |
| 查单接口 | https://jkapi-wansheng.douyaya.com/api/v1/pay/queryOrder |
| 商户ID (mchId) | 1011 |
| 商户秘钥 (merchantKey) | jkkGqwL7SbpRMZ7cviD8oZn |
| 支付测试编码 (productId) | T888 |
| 回调IP | 43.198.76.168 |
