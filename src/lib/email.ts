import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Jongrod <onboarding@resend.dev>"

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: string = "th"
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/${locale}/reset-password?token=${token}`

  if (!resend) {
    console.log("[Email] No Resend API key. Reset URL:", resetUrl)
    return { success: true }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Jongrod - รีเซ็ตรหัสผ่าน",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>รีเซ็ตรหัสผ่าน</h2>
          <p>คุณได้ร้องขอการรีเซ็ตรหัสผ่านสำหรับบัญชี Jongrod ของคุณ</p>
          <p>คลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            รีเซ็ตรหัสผ่าน
          </a>
          <p style="color: #666; font-size: 14px;">ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
          <p style="color: #666; font-size: 14px;">หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยอีเมลนี้</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${token}`

  if (!resend) {
    console.log("[Email] No Resend API key. Verify URL:", verifyUrl)
    return { success: true }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Jongrod - ยืนยันอีเมล",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>ยืนยันอีเมลของคุณ</h2>
          <p>ขอบคุณที่สมัครสมาชิก Jongrod!</p>
          <p>คลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            ยืนยันอีเมล
          </a>
          <p style="color: #666; font-size: 14px;">หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยอีเมลนี้</p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
