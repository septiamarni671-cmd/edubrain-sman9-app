import { handleOptions, json, methodAllowed, isAdmin } from "../_lib/common.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["GET"])) return;

  return json(res, 200, {
    ok: true,
    admin: isAdmin(req)
  });
}