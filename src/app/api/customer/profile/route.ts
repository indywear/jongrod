import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     tags:
 *       - Customer
 *     summary: Get customer profile
 *     description: Retrieves the authenticated user's profile information.
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
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
 *                     phone:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     role:
 *                       type: string
 *                     languagePreference:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     isPhoneVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *   patch:
 *     tags:
 *       - Customer
 *     summary: Update customer profile
 *     description: Updates the authenticated user's profile. Supports updating name, phone, and language preference.
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 pattern: "^0[689]\\d{8}$"
 *                 description: Thai phone number format
 *                 nullable: true
 *               languagePreference:
 *                 type: string
 *                 enum: [th, en]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Phone number already in use
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        languagePreference: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^0[689]\d{8}$/, "Invalid Thai phone number")
    .optional()
    .nullable(),
  languagePreference: z.enum(["th", "en"]).optional(),
})

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check phone uniqueness if changing phone
    if (data.phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          id: { not: authResult.user.id },
        },
      })
      if (existingUser) {
        return NextResponse.json(
          { error: "Phone number already in use" },
          { status: 409 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: authResult.user.id },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        languagePreference: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
