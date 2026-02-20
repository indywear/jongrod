import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireCustomer, verifyUserOwnership } from "@/lib/auth"

/**
 * @swagger
 * /api/customer/documents:
 *   get:
 *     tags:
 *       - Customer
 *     summary: List customer's documents
 *     description: Retrieves all uploaded documents (ID cards, driver licenses) for the authenticated customer.
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID (defaults to authenticated user)
 *     responses:
 *       200:
 *         description: List of customer documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to view these documents
 */
export async function GET(request: NextRequest) {
  // Require customer role
  const authResult = await requireCustomer(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || authResult.user.id

    // Verify user ownership
    const ownershipResult = await verifyUserOwnership(request, userId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}
