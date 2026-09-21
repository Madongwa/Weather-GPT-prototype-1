/**
 * WhatsApp is the dominant messaging channel in India, so a share link
 * costs almost nothing to add and multiplies an alert's real reach. A
 * `wa.me` link needs no API key or account — it just opens WhatsApp
 * (web or app) with the text pre-filled, sender picks who to send it to.
 */
export function whatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
