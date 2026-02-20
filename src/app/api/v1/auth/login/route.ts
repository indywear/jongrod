import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiKey } from "@/lib/api-key"
import { signToken } from "@/lib/jwt"
import { checkRateLimit } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(9).max(15).optional(),
  password: z.string().min(1),
}).refine(data => data.email || data.phone, {
  message: "Email or phone is required",
})

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login via API (external)
 *     description: Authenticate a user using API key + credentials. Returns a JWT token for subsequent requests.
 *     tags:
 *       - External Auth
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 expiresIn:
 *                   type: integer
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials or API key
 *       429:
 *         description: Rate limit exceeded
 */
export async function POST(request: NextRequest) {
  // Require API key with "login" permission
  const apiKeyResult = await requireApiKey(request, ["login"])
  if (apiKeyResult instanceof NextResponse) return apiKeyResult

  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const rateLimit = checkRateLimit(`v1-login:${ip}`, 10, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry after ${rateLimit.retryAfter}s` },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Email/phone and password are required" },
        { status: 400 }
      )
    }

    const { email, phone, password } = validation.data

    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
      include: {
        partnerAdmins: {
          select: { partnerId: true },
          take: 1,
        },
      },
    })

    const passwordToCompare = user?.password || "$2a$12$dummy.hash.to.prevent.timing.attacks"
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare)

    if (!user || !isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    if (user.isBlacklisted) {
      return NextResponse.json(
        { error: "Account is suspended" },
        { status: 403 }
      )
    }

    const partnerId = user.partnerAdmins?.[0]?.partnerId || null

    const token = await signToken({
      sub: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      partnerId,
    })

    return NextResponse.json({
      token,
      expiresIn: 86400,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        partnerId,
      },
    })
  } catch (error) {
    console.error("V1 login error:", error)
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    )
  }
}
