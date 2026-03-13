const {
  getMergedDevice,
  normalizeContact,
  normalizeSn,
  validateContact
} = require("../lib/upgrade-service");
const { parseJsonBody, sendJson } = require("../lib/response");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { message: "Method not allowed." });
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const sn = normalizeSn(body.sn);
    const contact = normalizeContact(body.contact);

    if (!sn) {
      sendJson(res, 400, { message: "기기 SN을 입력해 주세요." });
      return;
    }

    if (!contact || !validateContact(contact)) {
      sendJson(res, 400, { message: "유효한 휴대폰 번호 또는 이메일을 입력해 주세요." });
      return;
    }

    const device = await getMergedDevice(sn);

    if (!device) {
      sendJson(res, 404, { message: "해당 기기 정보 조회할 수 없습니다. 기기 SN을 다시 확인하세요" });
      return;
    }

    if (device.purchaseStatus === "paid") {
      sendJson(res, 409, {
        message: "이 기기는 이미 Zigbee 업그레이드 결제가 완료되었습니다.",
        device
      });
      return;
    }

    sendJson(res, 200, {
      message: "기기 확인이 완료되었습니다. 결제를 진행해 주세요.",
      device
    });
  } catch (error) {
    sendJson(res, 400, { message: error.message });
  }
};
