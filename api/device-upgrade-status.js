const {
  ensureThirdPartyAuthorized,
  getMergedDevice,
  normalizeSn,
  upsertHubBindingTimestamp
} = require("../lib/upgrade-service");
const { parseJsonBody, sendJson } = require("../lib/response");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH" && req.method !== "POST") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  const auth = ensureThirdPartyAuthorized(req.headers);
  if (!auth.ok) {
    sendJson(res, auth.status, { message: auth.message });
    return;
  }

  try {
    if (req.method === "GET") {
      const sn = normalizeSn(req.query?.sn);

      if (!sn) {
        sendJson(res, 400, {
          message: "Missing required query parameter: sn."
        });
        return;
      }

      const device = await getMergedDevice(sn);
      if (!device) {
        sendJson(res, 404, {
          message: "Device not found."
        });
        return;
      }

      sendJson(res, 200, {
        sn: device.sn,
        purchaseStatus: device.purchaseStatus,
        featureCode: device.featureCode,
        paidAt: device.upgradedAt,
        lastHubBoundAt: device.lastHubBoundAt,
        updatedAt: device.updatedAt
      });
      return;
    }

    const body = await parseJsonBody(req);
    const sn = normalizeSn(body.sn);
    const rawTimestamp = body.lastHubBoundAt;
    const lastHubBoundAt =
      rawTimestamp === null || rawTimestamp === "" || typeof rawTimestamp === "undefined"
        ? null
        : String(rawTimestamp).trim();

    if (!sn) {
      sendJson(res, 400, {
        message: "Missing required field: sn."
      });
      return;
    }

    if (lastHubBoundAt !== null && Number.isNaN(Date.parse(lastHubBoundAt))) {
      sendJson(res, 400, {
        message: "Invalid lastHubBoundAt. Use ISO 8601 format or null."
      });
      return;
    }

    const device = await getMergedDevice(sn);
    if (!device) {
      sendJson(res, 404, {
        message: "Device not found."
      });
      return;
    }

    await upsertHubBindingTimestamp(sn, lastHubBoundAt);
    const updatedDevice = await getMergedDevice(sn);

    sendJson(res, 200, {
      sn: updatedDevice.sn,
      purchaseStatus: updatedDevice.purchaseStatus,
      featureCode: updatedDevice.featureCode,
      paidAt: updatedDevice.upgradedAt,
      lastHubBoundAt: updatedDevice.lastHubBoundAt,
      updatedAt: updatedDevice.updatedAt
    });
  } catch (error) {
    if (error.message === "Invalid JSON body." || error.message === "Request body too large.") {
      sendJson(res, 400, { message: error.message });
      return;
    }

    sendJson(res, 500, { message: "Internal server error." });
  }
};
