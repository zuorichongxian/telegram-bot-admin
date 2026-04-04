# 接单测试7（金安支付通道）Spec

## Why

需要新增一个支付通道测试页"接单测试7"，复用服务端 paymentApi5 的全部功能模式（统一下单、订单查询、余额查询、回调记录、操作日志、接口文档），使用新的商户信息和配置参数。

## What Changes

- 新增前端 API 层：`paymentApi7.ts`（类型定义、配置、API 函数，复用 paymentApi5 的核心逻辑）
- 新增前端文档层：`paymentApi7Docs.ts`（静态接口文档）
- 新增前端工作区：`PaymentTest7Workspace.tsx`（UI 组件）
- 修改 App.tsx：新增"接单测试7"标签页和路由

**注意**：后端完全复用 paymentApi5 的路由和服务，无需新建后端代码。

## Impact

- Affected specs: 无（独立新模块，复用后端）
- Affected code:
  - 前端：`web/src/lib/`、`web/src/workspaces/`、`web/src/App.tsx`
  - 后端：无需修改（复用 paymentApi5）

## ADDED Requirements

### Requirement: 接单测试7 - 金安支付通道完整功能

系统 SHALL 提供与"接单测试5"功能对等的"接单测试7"工作区，复用繁星支付网关但使用独立的商户配置。

#### 对接信息

| 项目             | 值                                                   |
| ---------------- | ---------------------------------------------------- |
| 下单网关         | `http://test.demo.sanguozf.com/Pay_Index.html`       |
| 查询网关         | `http://test.demo.sanguozf.com/Pay_Trade_query.html` |
| 商户后台         | `http://test.demo.sanguozf.com/user.html`            |
| 商户名称         | 金安                                                 |
| 登录密码         | 123456                                               |
| 回调 IP          | 8.210.110.78,47.242.129.100,47.242.223.11           |
| 商务号（商户号） | 260506688                                            |
| 秘钥             | 7pcgb193qvmd0oqmxxrjg4ude5l0cxtf                     |
| 通道编码         | 102                                                  |
| 固定面额         | 50, 100, 200                                         |

#### Scenario: 统一下单

- **WHEN** 用户在配置面板填写商户号、秘钥等参数后，选择固定面额（50/100/200）或输入自定义金额，点击"发起统一下单"
- **THEN** 系统通过代理或直连向繁星支付下单网关发送请求，返回支付链接和订单信息

#### Scenario: 订单查询

- **WHEN** 用户输入商户订单号并点击"查询订单"
- **THEN** 系统向查询网关发送请求，返回订单最新状态和支付结果

#### Scenario: 余额查询

- **WHEN** 用户点击"查询余额"按钮
- **THEN** 系统返回商户余额信息

#### Scenario: 回调记录

- **WHEN** 支付网关向 `/api/payment5/callback` 发起异步通知（复用 payment5 回调接口）
- **THEN** 后端验证签名后将回调数据存入数据库，前端可查看回调列表（含签名验证状态）

#### Scenario: 接口文档展示

- **WHEN** 用户滚动到页面底部的"接口文档"区域
- **THEN** 展示支付接口的字段说明、签名规则、状态码说明

### Requirement: 固定面额选项

系统 SHALL 在统一下单表单中提供固定面额快捷选项（50元、100元、200元），用户可快速选择常用金额，也支持手动输入自定义金额。

### Requirement: 配置默认值

系统 SHALL 使用以下默认配置值：
- 商户号：260506688
- 秘钥：7pcgb193qvmd0oqmxxrjg4ude5l0cxtf
- 通道编码：102（如需传入）
