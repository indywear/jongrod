import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email().max(200),
  locale: z.string().max(5).optional(),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const { allowed, retryAfter } = checkRateLimit(`forgot-password:${ip}`, 3, 60000)

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter} seconds.` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const validation = forgotPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, locale } = validation.data

    // Always return success to prevent user enumeration
    const successResponse = NextResponse.json({
      message: "If an account exists with this email, a reset link has been sent.",
    })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return successResponse
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      },
    })

    await sendPasswordResetEmail(email, token, locale || "th")

    return successResponse
  } catch (error) {
    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
