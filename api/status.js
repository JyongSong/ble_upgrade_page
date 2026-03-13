const { getMergedDevice, normalizeSn } = require("../lib/upgrade-service");
const { sendJson } = require("../lib/response");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  try {
    const sn = normalizeSn(req.query?.sn);

    if (!sn) {
      sendJson(res, 400, { message: "기기 SN이 필요합니다." });
      return;
    }

    const device = await getMergedDevice(sn);
    if (!device) {
      sendJson(res, 404, { message: "해당 기기 정보 조회할 수 없습니다. 기기 SN을 다시 확인하세요" });
      return;
    }

    sendJson(res, 200, { device });
  } catch (error) {
    sendJson(res, 400, { message: error.message });
  }
};
