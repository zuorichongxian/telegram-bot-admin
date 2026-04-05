# 接单测试9 Spec

## Why

需要新增一个支付通道测试页"接单测试9"，对接新支付网关（47.76.172.252:8083），复用"接单测试2"的全部功能模式（统一下单、订单查询、回调记录、操作日志、接口文档），使用新的商户信息、网关地址和签名算法。

## What Changes

- 新增前端 API 层：`paymentApi9.ts`（类型定义、配置、签名、请求函数）
- 新增前端文档层：`paymentApi9Docs.ts`（静态接口文档）
- 新增前端工作区：`PaymentTest9Workspace.tsx`（UI 组件）
- 新增后端代理路由：`payment9ProxyRoutes.ts`（转发到 47.76.172.252:8083 网关）
- 新增后端回调路由：`payment9CallbackRoutes.ts`（Express 路由）
- 新增后端回调控制器：`payment9CallbackController.ts`（回调处理逻辑）
- 新增后端服务层：`Payment9CallbackService.ts`（数据库 CRUD）
- 新增后端签名工具：`payment9Sign.ts`（签名生成与验证）
- 修改数据库初始化：新增 `payment9_callbacks` 表及索引
- 修改服务器入口：注册 payment9 路由和代理中间件
- 修改 Vite 配置：新增 `/api/payment9-proxy` 和 `/api/payment9` 代理规则
- 修改 App.tsx：新增"接单测试9"标签页和路由

## Impact

- Affected specs: 无（独立新模块）
- Affected code:
    - 前端：`web/src/lib/`、`web/src/workspaces/`、`web/src/App.tsx`
    - 后端：`server/src/routes/`、`server/src/controllers/`、`server/src/services/`、`server/src/utils/`、`server/src/db/database.ts`、`server/src/app.ts`
    - 构建配置：`web/vite.config.ts`

## ADDED Requirements

### Requirement: 接单测试9 - 支付通道完整功能

系统 SHALL 提供与"接单测试2"功能对等的"接单测试9"工作区，对接 47.76.172.252:8083 支付网关。

#### 对接信息

| 项目             | 值                                                        |
| ---------------- | --------------------------------------------------------- |
| 下单网关         | `http://47.76.172.252:8083/index/api/order.html`          |
| 查询网关         | `http://47.76.172.252:8083/index/api/queryorder.html`     |
| 回调 IP          | 47.76.172.252                                             |
| 商户 ID (client_id)   | d4b8ab0c8bde8263bc0781ebd3b56feb                          |
| 商户密钥 (client_secret) | a2aa48565d94fed4130da333a96e9b7d1d3088a543c062f3e5d9d4bfba080218 |

#### 支付通道编码及金额限制

| 编码    | 通道名称 | 可选金额范围（元） |
| ------- | -------- | ------------------ |
| alipay  | 支付宝   | 10 - 50            |

#### Scenario: 统一下单

- **WHEN** 用户在配置面板填写商户ID、秘钥等参数后，输入金额并点击"发起统一下单"
- **THEN** 系统通过代理或直连向支付网关发送 POST 请求，返回 h5_url 和 qr_url 支付链接及订单信息

#### Scenario: 订单查询

- **WHEN** 用户输入平台订单号(order_sn)并点击"查询订单"
- **THEN** 系统向查询网关发送请求，返回订单最新状态和支付结果（is_pay: 0/1）

#### Scenario: 回调记录

- **WHEN** 支付网关向 `/api/payment9/callback` 发起异步通知
- **THEN** 后端验证签名后将回调数据存入数据库，前端可查看回调列表（含签名验证状态）

#### Scenario: 接口文档展示

- **WHEN** 用户滚动到页面底部的"接口文档"区域
- **THEN** 展示该支付网关的接口字段说明、签名规则、状态码说明

### Requirement: 签名算法

系统 SHALL 使用 MD5 签名算法，规则为：
1. 所有参数按照参数名首字母先后顺序排列
2. 把排序后的结果按照 参数名+参数值 的方式拼接
3. 拼装好的字符串首尾拼接 client_secret 进行 md5 加密后转大写

示例：
- 输入参数：`{client_id: 'xxx', timestamp: '1557229583621', name: 'aaa', age: '1'}`
- 排序后拼接：`age1client_idxxxnameaaatimestamp1557229583621`
- 首尾加 secret：`${client_secret}age1client_idxxxnameaaatimestamp1557229583621${client_secret}`
- MD5 大写结果作为 sign 值

### Requirement: 统一下单接口规范

接口 URL：`/index/api/order.html`
请求方式：POST
Content-Type：application/x-www-form-urlencoded

必填参数：
| 参数名        | 必选 | 类型   | 说明                           | 可用值 |
| ------------- | ---- | ------ | ------------------------------ | ------ |
| type          | 是   | string | 支付方式                       | alipay |
| total         | 是   | integer | 支付额度（单位元）              | 10-50  |
| api_order_sn  | 是   | string | 调用方提供的订单编号，用于回调通知 |       |
| notify_url    | 是   | string | 用户支付成功回调地址           |       |
| client_id     | 是   | string | 商户 id                        |       |
| timestamp     | 是   | string | 13位时间戳                     |       |
| sign          | 是   | string | 签名算法                       |       |

返回示例：
```json
{
  "code": 200,
  "status": 1,
  "msg": "下单成功",
  "data": {
    "order_sn": "190506-042956554953387",
    "api_order_sn": "C123297079385718",
    "type": "alipay",
    "h5_url": "...",
    "qr_url": "..."
  }
}
```

### Requirement: 订单查询接口规范

接口 URL：`/index/api/queryorder.html`
请求方式：POST
Content-Type：application/x-www-form-urlencoded

必填参数：
| 参数名    | 必选 | 类型   | 说明       | 可用值 |
| --------- | ---- | ------ | ---------- | ------ |
| order_sn  | 是   | string | 平台订单编号 |        |
| client_id | 是   | string | 商户 id    |        |
| timestamp | 是   | string | 时间戳     |        |
| sign      | 是   | string | 签名算法   |        |

返回示例：
```json
{
  "code": 200,
  "status": 1,
  "msg": "查询成功",
  "data": {
    "order_sn": "190506-042956554953387",
    "total": "100",
    "type": "alipay",
    "is_pay": "1"
  }
}
```

### Requirement: 回调接口规范

请求方式：POST
回调参数：
| 参数名        | 必选 | 类型   | 说明                                     | 可用值                        |
| ------------- | ---- | ------ | ---------------------------------------- | ----------------------------- |
| callbacks     | 是   | string | 状态值                                   | CODE_SUCCESS / CODE_FAILURE   |
| type          | 是   | string | 支付方式                                 |                               |
| total         | 是   | string | 支付总额                                 |                               |
| api_order_sn  | 是   | string | 客户端订单编号                            |                               |
| order_sn      | 是   | string | 平台订单编号                             |                               |
| sign          | 是   | string | 签名算法                                 |                               |

接收回调成功必须返回字符串 `success`。

### Requirement: 数据库表结构

系统 SHALL 创建 `payment9_callbacks` 表存储回调记录，包含以下字段：

- id (INTEGER PRIMARY KEY AUTOINCREMENT)
- callbacks (TEXT NOT NULL) — 回调状态（CODE_SUCCESS/CODE_FAILURE）
- type (TEXT NOT NULL) — 支付方式
- total (TEXT NOT NULL) — 支付总额
- api_order_sn (TEXT NOT NULL) — 客户端订单编号
- order_sn (TEXT NOT NULL) — 平台订单编号
- sign (TEXT NOT NULL) — 签名
- raw_data (TEXT NOT NULL) — 原始请求数据
- verified (INTEGER NOT NULL DEFAULT 0) — 签名验证结果
- created_at (TEXT NOT NULL) — 记录创建时间
