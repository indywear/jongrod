import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireBearerToken } from "@/lib/jwt"

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user info
 *     description: Returns user profile from JWT token.
 *     tags:
 *       - External Auth
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     partnerId:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Invalid or missing token
 */
export async function GET(request: NextRequest) {
  const authResult = await requireBearerToken(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isBlacklisted: true,
        partnerAdmins: {
          select: { partnerId: true },
          take: 1,
        },
      },
    })

    if (!user || user.isBlacklisted) {
      return NextResponse.json(
        { error: "User not found or suspended" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        partnerId: user.partnerAdmins?.[0]?.partnerId || null,
      },
    })
  } catch (error) {
    console.error("V1 me error:", error)
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    )
  }
}
