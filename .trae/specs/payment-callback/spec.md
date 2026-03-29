# 支付回调通知功能 Spec

## Why

当前拉单测试页面的异步通知地址和跳转通知地址为空，需要配置当前项目的前后端地址，并实现对应的回调接收功能，以便能够接收支付系统的异步通知和同步跳转。

## What Changes

- 后端新增 `/api/payment/callback` 路由，接收支付系统的异步通知
- 前端新增 `/payment-result` 页面，接收支付系统的同步跳转通知
- 更新默认配置，使用当前项目的地址作为回调地址
- 前端展示支付回调记录和历史

## Impact

- Affected specs: payment-test
- Affected code:
  - `server/src/app.ts` - 新增路由
  - `server/src/routes/paymentCallbackRoutes.ts` - 新增文件
  - `server/src/controllers/paymentCallbackController.ts` - 新增文件
  - `web/src/lib/paymentApi.ts` - 更新默认配置
  - `web/src/workspaces/PaymentTestWorkspace.tsx` - 新增回调记录展示

## ADDED Requirements

### Requirement: 后端支付回调接口

系统 SHALL 提供支付回调接口，接收支付系统的异步通知。

#### Scenario: 接收代收订单回调
- **WHEN** 支付系统发送 POST 请求到 `/api/payment/callback`
- **THEN** 系统验证签名并存储回调数据
- **AND** 返回 "SUCCESS" 表示接收成功

#### Scenario: 签名验证失败
- **WHEN** 支付系统发送的回调签名验证失败
- **THEN** 系统返回错误信息

### Requirement: 前端支付结果页面

系统 SHALL 提供支付结果展示页面，接收支付系统的同步跳转。

#### Scenario: 支付成功跳转
- **WHEN** 用户完成支付后被跳转到 `/payment-result`
- **THEN** 页面展示支付结果信息

### Requirement: 回调记录存储

系统 SHALL 存储支付回调记录，供前端查询展示。

#### Scenario: 查询回调记录
- **WHEN** 用户在拉单测试页面查看回调记录
- **THEN** 系统返回最近的回调记录列表

### Requirement: 默认回调地址配置

系统 SHALL 自动配置默认的回调地址。

#### Scenario: 使用默认配置
- **WHEN** 用户未手动配置回调地址
- **THEN** 系统使用当前项目的前后端地址作为默认值
- notifyUrl: `{后端地址}/api/payment/callback`
- returnUrl: `{前端地址}/payment-result`

## MODIFIED Requirements

### Requirement: PaymentTestWorkspace 组件

组件 SHALL 展示回调记录并提供配置自动填充功能。

#### Scenario: 展示回调记录
- **WHEN** 有支付回调发生
- **THEN** 页面实时展示最新的回调记录

#### Scenario: 自动填充回调地址
- **WHEN** 页面加载时
- **THEN** 自动填充当前项目的回调地址
