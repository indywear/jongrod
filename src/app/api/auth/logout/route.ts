import { NextRequest, NextResponse } from "next/server"
import { clearSession } from "@/lib/auth"

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout and clear session
 *     description: Logs out the current user by clearing the session cookie.
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  await clearSession(response, request)
  return response
}
