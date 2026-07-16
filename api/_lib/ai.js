export function aiStatus() {
  const provider = process.env.AI_PROVIDER || "groq";
  const model = process.env.AI_MODEL || "llama-3.1-8b-instant";
  const configured = Boolean(process.env.GROQ_API_KEY);

  return {
    ok: true,
    provider,
    model,
    configured,
    hasGroqKey: configured
  };
}

export function normalizeMessages(body) {
  if (Array.isArray(body?.messages)) return body.messages;

  const text =
    body?.prompt ||
    body?.message ||
    body?.text ||
    body?.content ||
    body?.transcript ||
    "";

  return [
    {
      role: "system",
      content:
        "Anda adalah asisten EduBrain SMAN 9 Depok. Jawab dalam Bahasa Indonesia yang rapi, praktis, dan membantu pekerjaan guru."
    },
    {
      role: "user",
      content: String(text || "Bantu saya membuat hasil yang rapi.")
    }
  ];
}

export async function callGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.AI_MODEL || "llama-3.1-8b-instant";

  if (!key) {
    throw new Error("GROQ_API_KEY belum diisi.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.25
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || "Gagal memanggil Groq AI.";
    throw new Error(message);
  }

  return data?.choices?.[0]?.message?.content || "";
}