import { handleOptions, json } from "./_lib/common.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  json(res, 200, {
    ok: true,
    service: "EduBrain SMAN 9 API",
    time: new Date().toISOString()
  });
}