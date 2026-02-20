import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current logged-in user
 *     description: Returns the currently authenticated user's profile data based on the session cookie.
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Returns the authenticated user object
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
 *                     avatarUrl:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Not authenticated or session expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not authenticated"
 */
export async function GET(request: NextRequest) {
  const { user, error } = await getSession(request)

  if (!user) {
    return NextResponse.json(
      { error: error || "Not authenticated" },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
