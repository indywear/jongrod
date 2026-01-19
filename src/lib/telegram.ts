const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface TelegramMessage {
  chatId: string
  text: string
  parseMode?: "HTML" | "Markdown"
}

export async function sendTelegramMessage({
  chatId,
  text,
  parseMode = "HTML",
}: TelegramMessage): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("Telegram bot token not configured")
    return { success: false, error: "Telegram bot token not configured" }
  }

  if (!chatId) {
    console.warn("No chat ID provided")
    return { success: false, error: "No chat ID provided" }
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      }
    )

    const data = await response.json()

    if (!data.ok) {
      console.error("Telegram API error:", data)
      return { success: false, error: data.description }
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending Telegram message:", error)
    return { success: false, error: String(error) }
  }
}

interface BookingNotification {
  bookingNumber: string
  customerName: string
  customerPhone: string
  carBrand: string
  carModel: string
  carYear: number
  pickupDatetime: Date
  returnDatetime: Date
  pickupLocation: string
  totalPrice: number
}

export async function sendBookingNotification(
  chatId: string,
  booking: BookingNotification
): Promise<{ success: boolean; error?: string }> {
  const formatDate = (date: Date) => {
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, "0")
    const month = (d.getMonth() + 1).toString().padStart(2, "0")
    const year = d.getFullYear()
    const hour = d.getHours().toString().padStart(2, "0")
    const minute = d.getMinutes().toString().padStart(2, "0")
    return `${day}/${month}/${year} ${hour}:${minute} น.`
  }

  const text = `
🚗 <b>การจองใหม่!</b>

📋 <b>เลขที่จอง:</b> ${booking.bookingNumber}

👤 <b>ลูกค้า:</b> ${booking.customerName}
📱 <b>เบอร์โทร:</b> ${booking.customerPhone}

🚙 <b>รถ:</b> ${booking.carBrand} ${booking.carModel} ${booking.carYear}

📅 <b>รับรถ:</b> ${formatDate(booking.pickupDatetime)}
📅 <b>คืนรถ:</b> ${formatDate(booking.returnDatetime)}
📍 <b>สถานที่รับ:</b> ${booking.pickupLocation}

💰 <b>ราคารวม:</b> ${booking.totalPrice.toLocaleString()} บาท

⏰ กรุณาติดต่อลูกค้าภายใน 15 นาที
`.trim()

  return sendTelegramMessage({ chatId, text })
}
