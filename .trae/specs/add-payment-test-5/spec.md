# 拉单测试5（繁星支付通道）Spec

## Why
需要新增一个支付通道测试页"拉单测试5"，对接繁星支付网关（fanxingpay），复用"拉单测试2"的全部功能模式（统一下单、订单查询、余额查询、回调记录、操作日志、接口文档），使用新的商户信息和网关地址。

## What Changes
- 新增前端 API 层：`paymentApi5.ts`（类型定义、配置、签名、请求函数）
- 新增前端文档层：`paymentApi5Docs.ts`（静态接口文档）
- 新增前端工作区：`PaymentTest5Workspace.tsx`（UI 组件）
- 新增后端代理路由：`payment5ProxyRoutes.ts`（转发到 fanxingpay 网关）
- 新增后端回调路由：`payment5CallbackRoutes.ts`（Express 路由）
- 新增后端回调控制器：`payment5CallbackController.ts`（回调处理逻辑）
- 新增后端服务层：`Payment5CallbackService.ts`（数据库 CRUD）
- 新增后端签名工具：`payment5Sign.ts`（签名生成与验证）
- 修改数据库初始化：新增 `payment5_callbacks` 表及索引
- 修改服务器入口：注册 payment5 路由和代理中间件
- 修改 Vite 配置：新增 `/api/payment5-proxy` 和 `/api/payment5` 代理规则
- 修改 App.tsx：新增"接单测试5"标签页和路由

## Impact
- Affected specs: 无（独立新模块）
- Affected code:
  - 前端：`web/src/lib/`、`web/src/workspaces/`、`web/src/App.tsx`
  - 后端：`server/src/routes/`、`server/src/controllers/`、`server/src/services/`、`server/src/utils/`、`server/src/db/database.ts`、`server/src/app.ts`
  - 构建配置：`web/vite.config.ts`

## ADDED Requirements

### Requirement: 拉单测试5 - 繁星支付通道完整功能
系统 SHALL 提供与"拉单测试2"功能对等的"拉单测试5"工作区，对接繁星支付网关。

#### 对接信息
| 项目 | 值 |
|------|-----|
| 下单网关 | `http://hh74.fanxingpay.sgjtpay.com/Pay_Index.html` |
| 查询网关 | `http://hh74.fanxingpay.sgjtpay.com/Pay_Trade_query.html` |
| 商户后台 | `http://hh74.fanxingpay.sgjtpay.com/user.html` |
| 商户名称 | 游戏城 |
| 登录密码 | 123456 |
| 回调 IP | 8.217.247.234,8.217.228.121,8.217.106.121 |
| 商务号（商户号） | 260505221 |
| 秘钥 | 4o9hbhxpprz4cnfrxowxps7rgyu4wauy |

#### Scenario: 统一下单
- **WHEN** 用户在配置面板填写商户号、秘钥、支付编码等参数后，输入金额并点击"发起统一下单"
- **THEN** 系统通过代理或直连向繁星支付下单网关发送请求，返回支付链接和订单信息

#### Scenario: 订单查询
- **WHEN** 用户输入商户订单号并点击"查询订单"
- **THEN** 系统向查询网关发送请求，返回订单最新状态和支付结果

#### Scenario: 余额查询
- **WHEN** 用户点击"查询余额"按钮
- **THEN** 系统返回商户余额信息

#### Scenario: 回调记录
- **WHEN** 繁星支付网关向 `/api/payment5/callback` 发起异步通知
- **THEN** 后端验证签名后将回调数据存入数据库，前端可查看回调列表（含签名验证状态）

#### Scenario: 接口文档展示
- **WHEN** 用户滚动到页面底部的"接口文档"区域
- **THEN** 展示繁星支付的接口字段说明、签名规则、状态码说明

### Requirement: 签名算法
系统 SHALL 使用 MD5 签名算法，规则为：所有非空参数按 ASCII 升序排列 → key=value&key2=value2 格式拼接 → 末尾追加 &key=秘钥 → MD5(32位大写)

### Requirement: 数据库表结构
系统 SHALL 创建 `payment5_callbacks` 表存储回调记录，包含以下字段：
- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- mch_id (TEXT NOT NULL) — 商户号
- trade_no (TEXT NOT NULL) — 支付订单号
- out_trade_no (TEXT NOT NULL) — 商户订单号
- amount (TEXT NOT NULL) — 订单金额
- order_status (INTEGER NOT NULL) — 订单状态
- sign (TEXT NOT NULL) — 签名
- raw_data (TEXT NOT NULL) — 原始请求数据
- verified (INTEGER NOT NULL DEFAULT 0) — 签名验证结果
- created_at (TEXT NOT NULL) — 记录创建时间
