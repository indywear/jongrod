import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSession, checkRateLimit } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Validation schema
const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(9).max(15).optional(),
  password: z.string().min(1),
}).refine(data => data.email || data.phone, {
  message: "Email or phone is required",
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60000) // 5 attempts per minute

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `กรุณารอ ${rateLimit.retryAfter} วินาทีก่อนลองใหม่` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมล/เบอร์โทร และรหัสผ่าน" },
        { status: 400 }
      )
    }

    const { email, phone, password } = validation.data

    // Find user
    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
      include: {
        partnerAdmin: {
          select: { partnerId: true }
        }
      }
    })

    // Use constant-time comparison to prevent timing attacks
    // Always hash a dummy password even if user not found
    const passwordToCompare = user?.password || "$2a$12$dummy.hash.to.prevent.timing.attacks"
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare)

    // Generic error message to prevent user enumeration
    if (!user || !isPasswordValid) {
      return NextResponse.json(
        { error: "อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      )
    }

    // Check if blacklisted
    if (user.isBlacklisted) {
      return NextResponse.json(
        { error: "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 403 }
      )
    }

    // Create response with session cookie
    const userData = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      partnerId: user.partnerAdmin?.partnerId || null,
    }

    const response = NextResponse.json({ user: userData })

    // Set session cookie
    await createSession(user.id, response)

    return response
  } catch (error) {
    console.error("Error logging in:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    )
  }
}
