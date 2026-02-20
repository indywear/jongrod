import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/auth"
import { z } from "zod"

const contactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().max(20).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
})

/**
 * @swagger
 * /api/contact:
 *   post:
 *     tags:
 *       - Content
 *     summary: Send contact form message
 *     description: Submits a contact form message. Rate limited to 3 requests per minute per IP. Sends email via Resend if configured, otherwise logs to console.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 200
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *               subject:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests (rate limited)
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const { allowed, retryAfter } = checkRateLimit(`contact:${ip}`, 3, 60000)

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const validation = contactSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Escape HTML to prevent injection in email
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

    // Try to send email via Resend if API key is configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: "Jongrod Contact <onboarding@resend.dev>",
        to: [process.env.CONTACT_EMAIL || "koondyasdw@gmail.com"],
        subject: `[Jongrod Contact] ${data.subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(data.phone || "N/A")}</p>
          <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
          <hr />
          <p>${escapeHtml(data.message).replace(/\n/g, "<br />")}</p>
        `,
      })
    } else {
      // Log to console if no email service configured
      console.log("Contact form submission:", data)
    }

    return NextResponse.json({ message: "Message sent successfully" })
  } catch (error) {
    console.error("Error processing contact form:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
