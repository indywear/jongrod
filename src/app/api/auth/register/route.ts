import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createSession, checkRateLimit } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Validation schema with strong password requirements
const registerSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง").optional(),
  phone: z.string()
    .regex(/^0[689]\d{8}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)")
    .optional(),
  password: z.string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .regex(/[A-Z]/, "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    .regex(/[a-z]/, "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    .regex(/[0-9]/, "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว"),
  firstName: z.string()
    .min(1, "กรุณากรอกชื่อ")
    .max(100, "ชื่อยาวเกินไป")
    .regex(/^[a-zA-Zก-๙\s]+$/, "ชื่อไม่ถูกต้อง"),
  lastName: z.string()
    .min(1, "กรุณากรอกนามสกุล")
    .max(100, "นามสกุลยาวเกินไป")
    .regex(/^[a-zA-Zก-๙\s]+$/, "นามสกุลไม่ถูกต้อง"),
}).refine(data => data.email || data.phone, {
  message: "กรุณากรอกอีเมลหรือเบอร์โทร",
})

// Sanitize input to prevent XSS
function sanitize(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim()
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user account
 *     description: Creates a new user account with email or phone, password, and name. Automatically logs in the user by setting a session cookie. Rate limited to 3 attempts per minute per IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: Registration successful. Returns user data and sets a session cookie.
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                       nullable: true
 *                     phone:
 *                       type: string
 *                       nullable: true
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error (invalid email, weak password, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       409:
 *         description: Email or phone number already in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *
 * components:
 *   schemas:
 *     UserRegister:
 *       type: object
 *       required:
 *         - password
 *         - firstName
 *         - lastName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email (required if phone is not provided)
 *           example: "user@example.com"
 *         phone:
 *           type: string
 *           pattern: "^0[689]\\d{8}$"
 *           description: Thai phone number (required if email is not provided)
 *           example: "0812345678"
 *         password:
 *           type: string
 *           minLength: 8
 *           description: "Password (min 8 chars, must include uppercase, lowercase, and digit)"
 *           example: "MyPassword123"
 *         firstName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: First name (Thai or English letters only)
 *           example: "John"
 *         lastName:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Last name (Thai or English letters only)
 *           example: "Doe"
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkRateLimit(`register:${ip}`, 3, 60000) // 3 attempts per minute

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `กรุณารอ ${rateLimit.retryAfter} วินาทีก่อนลองใหม่` },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.issues.map(e => e.message)
      return NextResponse.json(
        { error: errors[0] },
        { status: 400 }
      )
    }

    const { email, phone, password, firstName, lastName } = validation.data

    // Sanitize text inputs
    const sanitizedFirstName = sanitize(firstName)
    const sanitizedLastName = sanitize(lastName)

    // Check for existing email
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })
      if (existingEmail) {
        return NextResponse.json(
          { error: "อีเมลนี้ถูกใช้งานแล้ว" },
          { status: 409 }
        )
      }
    }

    // Check for existing phone
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      })
      if (existingPhone) {
        return NextResponse.json(
          { error: "เบอร์โทรนี้ถูกใช้งานแล้ว" },
          { status: 409 }
        )
      }
    }

    // Hash password with consistent salt rounds
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        role: "CUSTOMER", // Always create as customer - admin creates other roles
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    })

    // Create session and set cookie
    const response = NextResponse.json({ user }, { status: 201 })
    await createSession(user.id, response)

    return response
  } catch (error) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่" },
      { status: 500 }
    )
  }
}
