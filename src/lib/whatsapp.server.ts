/**
 * Sends one-time codes over the WhatsApp Cloud API.
 *
 * Required secrets (set them and code delivery turns on automatically):
 *   WHATSAPP_PHONE_NUMBER_ID  - the sender phone number id from Meta
 *   WHATSAPP_TOKEN            - a permanent access token for that number
 *   WHATSAPP_TEMPLATE_NAME    - optional, defaults to "verification_code"
 *   WHATSAPP_TEMPLATE_LANG    - optional, defaults to "en_US"
 */

export function whatsappConfigured() {
  return Boolean(process.env["WHATSAPP_PHONE_NUMBER_ID"] && process.env["WHATSAPP_TOKEN"]);
}

export async function sendWhatsappCode(phone: string, code: string) {
  const phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  const token = process.env["WHATSAPP_TOKEN"];
  if (!phoneNumberId || !token) {
    return { sent: false as const, reason: "not_configured" as const };
  }

  const template = process.env["WHATSAPP_TEMPLATE_NAME"] ?? "verification_code";
  const language = process.env["WHATSAPP_TEMPLATE_LANG"] ?? "en_US";

  const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/^\+/, ""),
      type: "template",
      template: {
        name: template,
        language: { code: language },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: code }],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("whatsapp send failed", response.status, detail);
    return { sent: false as const, reason: "provider_error" as const };
  }

  return { sent: true as const };
}
