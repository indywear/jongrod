import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * @swagger
 * /api/admin/commissions/{id}:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update commission status (mark as paid)
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PAID]
 *     responses:
 *       200:
 *         description: Commission marked as paid
 *       400:
 *         description: Invalid status or already paid
 *       404:
 *         description: Commission log not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (status !== "PAID") {
      return NextResponse.json(
        { error: "Only PAID status is allowed" },
        { status: 400 }
      )
    }

    const commission = await prisma.commissionLog.findUnique({
      where: { id },
    })

    if (!commission) {
      return NextResponse.json(
        { error: "Commission log not found" },
        { status: 404 }
      )
    }

    if (commission.status === "PAID") {
      return NextResponse.json(
        { error: "Commission already marked as paid" },
        { status: 400 }
      )
    }

    const updatedCommission = await prisma.commissionLog.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    })

    return NextResponse.json({ commission: updatedCommission })
  } catch (error) {
    console.error("Error updating commission:", error)
    return NextResponse.json(
      { error: "Failed to update commission" },
      { status: 500 }
    )
  }
}
