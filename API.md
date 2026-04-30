# 设备升级状态 API

本文档说明 `device upgrade status` 接口的使用方式，供第三方集成开发参考。
当前文档包含两类能力：

- `GET`：查询设备升级状态
- `POST`：写入最近绑定 Hub 的时间

当前版本：`v1`。响应字段结构保持稳定，如有破坏性变更将提前通知或新增版本。

## 接口概览

- Base URL：`https://www.aqaralife-service.kr/ble_upgrade`
- 用途：查询指定设备是否已完成 Zigbee 付费升级
- 方法：`GET`
- 路径：`/api/device-upgrade-status`
- 完整 URL：`{Base URL}/api/device-upgrade-status?sn=<DEVICE_SN>`
- 版本：`v1`
- 认证方式：`Bearer Token`
- 返回格式：`application/json`

## 请求说明

### HTTP 示例

```http
GET /ble_upgrade/api/device-upgrade-status?sn=A01460/LS1ELU01801 HTTP/1.1
Host: www.aqaralife-service.kr
Authorization: Bearer YOUR_API_KEY
Accept: application/json
```

### Query 参数

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sn` | string | 是 | 设备序列号 |

### Header

| Header | 必填 | 说明 |
| --- | --- | --- |
| `Authorization` | 是 | 格式：`Bearer <API_KEY>` |
| `Accept` | 否 | 建议传 `application/json` |

## 写入最近绑定 Hub 时间

第三方可通过写接口更新设备最近一次绑定 Hub 的时间。

- 方法：`POST`
- 路径：`/api/device-upgrade-status`
- 完整 URL：`{Base URL}/api/device-upgrade-status`

### POST 请求示例

```http
POST /ble_upgrade/api/device-upgrade-status HTTP/1.1
Host: www.aqaralife-service.kr
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json

{
  "sn": "A01460/LS1ELU01801",
  "lastHubBoundAt": "2026-04-24T09:30:00+09:00"
}
```

### POST 请求体

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sn` | string | 是 | 设备序列号 |
| `lastHubBoundAt` | string（ISO 8601） / null | 是 | 最近绑定 Hub 的时间；没有则传 `null` |

### POST 成功响应示例

```json
{
  "sn": "A01460/LS1ELU01801",
  "purchaseStatus": "paid",
  "featureCode": "zigbee",
  "paidAt": "2026-03-13T06:03:50.035+00:00",
  "lastHubBoundAt": "2026-04-24T09:30:00+09:00",
  "updatedAt": "2026-04-24T00:30:00.000+00:00"
}
```

## API Key 获取与管理

### 获取方式

当前接口使用平台侧分配的第三方专用 API Key，不提供公开的自助申请后台。

第三方如需接入，请通过 Aqara 对接窗口申请，通常由以下任一角色发放：

- 业务对接人
- 技术对接人
- 平台运维/接口管理员

发放方式为人工生成并单独下发，调用方收到后按如下方式使用：

```http
Authorization: Bearer <API_KEY>
```

当前开发联调使用的 API Key 为：

```text
d7087443b3fd2c1bc90ad48012af83cf9fd9b9808999f77299fc42ecd60a658d
```

说明：

- 一个合作方建议使用一套独立 API Key，便于审计和后续替换
- API Key 仅用于服务端调用，不应嵌入前端网页或移动端安装包
- 如需新增测试环境/正式环境，可分别申请独立 Key
- 技术对接人：Song（`songzy@aqara.kr`）

### 有效期与轮换策略

当前 API Key 默认不设置固定到期时间，不会按天或按月自动过期。

当前已下发给第三方的 API Key 在未发生安全轮换前可持续使用，不需要定期更新。

但在以下场景下，应主动轮换：

- 合作方人员或系统发生变更
- 怀疑 API Key 已泄露
- 接口调用方需要切换环境
- 平台方进行例行安全轮换

建议轮换流程如下：

1. 由第三方向 Aqara 对接窗口申请新 Key
2. 平台生成并下发新 Key
3. 第三方完成新 Key 切换验证
4. 平台停用旧 Key

建议在生产环境采用“先发新 Key、确认切换成功后再停旧 Key”的方式，避免接口中断。

如遇 API Key 失效、遗失或疑似泄露，请联系 Aqara 对接人重新签发，不支持通过接口自助刷新。

## 查询成功响应（GET）

### 状态码

`200 OK`

### 返回示例

```json
{
  "sn": "A01460/LS1ELU01801",
  "purchaseStatus": "paid",
  "featureCode": "zigbee",
  "paidAt": "2026-03-13T06:03:50.035+00:00",
  "lastHubBoundAt": "2026-04-24T09:30:00+09:00",
  "updatedAt": "2026-03-13T06:03:50.035+00:00"
}
```

### 字段说明

| 字段名 | 类型 | 可空 | 说明 |
| --- | --- | --- | --- |
| `sn` | string | 否 | 设备序列号 |
| `purchaseStatus` | string | 否 | 购买状态（见下方状态定义） |
| `featureCode` | string | 否 | 升级功能编码，当前固定为 `zigbee` |
| `paidAt` | string（ISO 8601） | 是 | 支付完成时间，未购买时为 `null` |
| `lastHubBoundAt` | string（ISO 8601） | 是 | 最近绑定 Hub 的时间，没有则为 `null` |
| `updatedAt` | string（ISO 8601） | 是 | 最近一次状态更新时间 |

## 写入成功响应（POST）

### 状态码

`200 OK`

### 返回示例

```json
{
  "sn": "A01460/LS1ELU01801",
  "purchaseStatus": "paid",
  "featureCode": "zigbee",
  "paidAt": "2026-03-13T06:03:50.035+00:00",
  "lastHubBoundAt": "2026-04-24T09:30:00+09:00",
  "updatedAt": "2026-04-24T00:30:00.000+00:00"
}
```

说明：

- POST 成功后，接口会返回该设备的最新状态
- `lastHubBoundAt` 会更新为本次写入的值
- 如果传入 `null`，则表示清空最近绑定 Hub 时间

## 购买状态定义

| 值 | 含义 |
| --- | --- |
| `pending` | 尚未完成购买 |
| `paid` | 已完成购买 |

## 错误响应

### `400 Bad Request`（GET）

GET 查询时，请求参数缺失或不合法。

```json
{
  "message": "Missing required query parameter: sn."
}
```

### `400 Bad Request`（POST）

POST 写入时，请求体缺失或字段不合法。

缺少 `sn` 示例：

```json
{
  "message": "Missing required field: sn."
}
```

`lastHubBoundAt` 格式错误示例：

```json
{
  "message": "Invalid lastHubBoundAt. Use ISO 8601 format or null."
}
```

请求体不是合法 JSON 时，也会返回：

```json
{
  "message": "Invalid JSON body."
}
```

### `401 Unauthorized`

未提供 API Key 或 API Key 无效。

```json
{
  "message": "Unauthorized."
}
```

### `404 Not Found`

数据库中不存在对应的设备 SN。

```json
{
  "message": "Device not found."
}
```

### `500 Internal Server Error`

服务端发生临时错误。

```json
{
  "message": "Internal server error."
}
```

## 接口约定

- 第三方可通过 `GET /api/device-upgrade-status` 查询设备升级状态。
- 第三方可通过 `POST /api/device-upgrade-status` 写入 `lastHubBoundAt` 字段。
- 第三方不能修改 `purchaseStatus`、`paidAt`、`featureCode` 等平台控制字段。
- 查询唯一依据是 `sn`。
- 如果设备存在但尚未生成升级购买记录，接口会返回 `purchaseStatus: "pending"`。
- 时间字段统一使用 ISO 8601 格式。
- `lastHubBoundAt` 在查询接口中返回，在写接口中可更新或清空。

## 集成流程

1. 保存 Base URL 和 API Key。
2. 在需要判断设备是否已开通 Zigbee 升级时，按设备 SN 调用接口。
3. 如需写入最近绑定 Hub 时间，调用 `POST /api/device-upgrade-status`。
4. 根据 `purchaseStatus` 和 `lastHubBoundAt` 字段处理业务逻辑。
5. 如果后续增加新的状态值，将通过版本更新或提前通知的方式处理。

## cURL 调用示例

```bash
curl -X GET \
  "https://www.aqaralife-service.kr/ble_upgrade/api/device-upgrade-status?sn=A01460/LS1ELU01801" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: application/json"
```

```bash
curl -X POST \
  "https://www.aqaralife-service.kr/ble_upgrade/api/device-upgrade-status" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "sn": "A01460/LS1ELU01801",
    "lastHubBoundAt": "2026-04-24T09:30:00+09:00"
  }'
```

## 变更记录

| 日期 | 版本 | 说明 |
| --- | --- | --- |
| 2026-03-13 | v1 | 初始版本，开发联调 |
| 2026-03-24 | v1 | 正式上线，域名切换至 `www.aqaralife-service.kr` |
| 2026-04-24 | v1 | 新增 `lastHubBoundAt` 字段，并开放第三方写入接口 |
| 2026-04-30 | v1 | 第三方写入 `lastHubBoundAt` 的推荐调用方式调整为 `POST` |
