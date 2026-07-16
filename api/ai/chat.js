import { handleOptions, json, methodAllowed, readJson } from "../_lib/common.js";
import { callGroq, normalizeMessages } from "../_lib/ai.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!methodAllowed(req, res, ["POST"])) return;

  try {
    const body = await readJson(req);
    const messages = normalizeMessages(body);
    const text = await callGroq(messages);

    return json(res, 200, {
      ok: true,
      reply: text,
      answer: text,
      text,
      content: text
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error.message || "AI gagal merespons."
    });
  }
}