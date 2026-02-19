import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import crypto from "crypto"

// Helper to generate SSO Token (HMAC Signed)
function generateSSOToken(userId: string) {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) throw new Error("NEXTAUTH_SECRET environment variable is required")
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
    const data = `${userId}:${expiresAt}`
    const signature = crypto.createHmac("sha256", secret).update(data).digest("hex")
    // Return Base64 encoded token
    return Buffer.from(`${data}:${signature}`).toString("base64")
}

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[a-z]/, "Password must contain a lowercase letter")
        .regex(/[0-9]/, "Password must contain a digit"),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().regex(/^0[689]\d{8}$/, "Invalid Thai phone number"),
})

/**
 * @swagger
 * /api/auth/external-register:
 *   post:
 *     summary: Register a new user from external source
 *     description: Creates a new customer account. Returns the created user's ID.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegister'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 userId:
 *                   type: string
 *                 redirectUrl:
 *                   type: string
 *                   description: URL to redirect the user for auto-login
 *       400:
 *         description: Invalid input or User already exists
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const result = registerSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid input", details: result.error.format() },
                { status: 400 }
            )
        }

        const { email, password, firstName, lastName, phone } = result.data

        // Check existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }],
            },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email or phone already exists" },
                { status: 400 }
            )
        }

        // Hash password with consistent salt rounds
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone,
                role: "CUSTOMER",
                isEmailVerified: false,
            },
        })

        // Generate SSO Token
        const ssoToken = generateSSOToken(newUser.id)
        const baseUrl = process.env.NEXTAUTH_URL || "https://jongrod.vercel.app"
        const redirectUrl = `${baseUrl}/auth/sso?token=${ssoToken}`

        return NextResponse.json(
            {
                message: "User registered successfully",
                userId: newUser.id,
                redirectUrl
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
