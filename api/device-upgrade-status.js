const {
  ensureThirdPartyAuthorized,
  getMergedDevice,
  normalizeSn
} = require("../lib/upgrade-service");
const { sendJson } = require("../lib/response");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  const auth = ensureThirdPartyAuthorized(req.headers);
  if (!auth.ok) {
    sendJson(res, auth.status, { message: auth.message });
    return;
  }

  try {
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
      updatedAt: device.updatedAt
    });
  } catch {
    sendJson(res, 500, { message: "Internal server error." });
  }
};
