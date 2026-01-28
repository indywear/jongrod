
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(9),
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
                { error: "Invalid input", details: result.error.errors },
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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

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

        return NextResponse.json(
            { message: "User registered successfully", userId: newUser.id },
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
