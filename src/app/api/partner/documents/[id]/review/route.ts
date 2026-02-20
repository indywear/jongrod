import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * @swagger
 * /api/partner/documents/{id}/review:
 *   patch:
 *     tags:
 *       - Partner
 *     summary: Review a document (approve/reject)
 *     security:
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
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
 *                 enum: [APPROVED, REJECTED]
 *                 description: Review decision
 *               rejectionReason:
 *                 type: string
 *                 description: Required when status is REJECTED
 *     responses:
 *       200:
 *         description: Document reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 document:
 *                   type: object
 *       400:
 *         description: Invalid status or missing rejection reason
 *       403:
 *         description: Not authorized to review this document
 *       404:
 *         description: Document not found
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { status, rejectionReason, partnerId } = body

    const targetPartnerId = partnerId || authResult.user.partnerId

    if (!targetPartnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, targetPartnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      )
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            bookings: {
              where: { partnerId: targetPartnerId },
              take: 1,
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Verify the document belongs to a customer of this partner
    if (document.user.bookings.length === 0) {
      return NextResponse.json(
        { error: "Not authorized to review this document" },
        { status: 403 }
      )
    }

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedById: authResult.user.id,
      },
    })

    return NextResponse.json({ document: updatedDocument })
  } catch (error) {
    console.error("Error reviewing document:", error)
    return NextResponse.json(
      { error: "Failed to review document" },
      { status: 500 }
    )
  }
}
