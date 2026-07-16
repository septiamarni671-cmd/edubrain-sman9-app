import { handleOptions, json, methodAllowed } from "../_lib/common.js";
import { aiStatus } from "../_lib/ai.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["GET"])) return;

  return json(res, 200, aiStatus());
}