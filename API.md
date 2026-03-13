# 设备升级状态查询 API

本文档用于第三方联调开发，说明 `device upgrade status` 查询接口的使用方式。

当前文档基于开发联调版本 `v1`。在正式上线前，开发环境域名、认证密钥、示例数据可能会调整，但以下响应字段结构原则上保持不变。

## 接口概览

- 用途：查询指定设备是否已完成 Zigbee 付费升级
- 方法：`GET`
- 路径：`/api/device-upgrade-status`
- 版本：`v1`
- 认证方式：`Bearer Token`
- 返回格式：`application/json`

## 请求说明

### HTTP 示例

```http
GET /api/device-upgrade-status?sn=A01460/LS1ELU01801 HTTP/1.1
Authorization: Bearer YOUR_DEV_API_KEY
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

## 成功响应

### 状态码

`200 OK`

### 返回示例

```json
{
  "sn": "A01460/LS1ELU01801",
  "purchaseStatus": "paid",
  "featureCode": "zigbee",
  "paidAt": "2026-03-13T06:03:50.035+00:00",
  "updatedAt": "2026-03-13T06:03:50.035+00:00"
}
```

### 字段说明

| 字段名 | 类型 | 可空 | 说明 |
| --- | --- | --- | --- |
| `sn` | string | 否 | 设备序列号 |
| `purchaseStatus` | string | 否 | 购买状态 |
| `featureCode` | string | 否 | 升级功能编码，当前固定为 `zigbee` |
| `paidAt` | string（ISO 8601） | 是 | 支付完成时间，未购买时为 `null` |
| `updatedAt` | string（ISO 8601） | 是 | 最近一次状态更新时间 |

## 购买状态定义

| 值 | 含义 |
| --- | --- |
| `pending` | 尚未完成购买 |
| `paid` | 已完成购买 |

## 错误响应

### `400 Bad Request`

请求参数缺失或不合法。

```json
{
  "message": "Missing required query parameter: sn."
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

## 联调约定

- 该接口为第三方只读查询接口。
- 第三方不能通过该接口修改购买状态。
- 查询唯一依据是 `sn`。
- 如果设备存在，但尚未生成升级购买记录，接口会返回 `purchaseStatus: "pending"`。
- 时间字段统一使用 ISO 8601 格式。

## 建议联调流程

1. 第三方保存你提供的开发环境 Base URL 和 API Key。
2. 第三方在需要判断设备是否已开通 Zigbee 升级时，按设备 SN 调用接口。
3. 当前联调阶段，第三方只需处理 `pending` 和 `paid` 两种状态。
4. 如果后续增加新的状态值，将通过版本更新或提前通知的方式处理。

## cURL 调用示例

```bash
curl -X GET \
  "http://127.0.0.1:3000/api/device-upgrade-status?sn=A01460/LS1ELU01801" \
  -H "Authorization: Bearer YOUR_DEV_API_KEY" \
  -H "Accept: application/json"
```

## 变更说明

- 当前阶段：开发联调阶段
- 兼容性目标：在第三方开发期间保持 `v1` 响应字段稳定
- 如果后续必须发生破坏性变更，建议新增版本接口，或提前通知第三方
