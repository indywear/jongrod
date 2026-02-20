import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * @swagger
 * /api/admin/api-keys/{id}:
 *   patch:
 *     summary: Update an API key
 *     description: Update API key name, permissions, active status, or expiry.
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: API key updated
 *       404:
 *         description: API key not found
 *   delete:
 *     summary: Delete an API key
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key deleted
 *       404:
 *         description: API key not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.permissions !== undefined) updateData.permissions = body.permissions
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    }

    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: updateData,
      include: {
        partner: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ apiKey })
  } catch (error) {
    console.error("Error updating API key:", error)
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params

    const existing = await prisma.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    await prisma.apiKey.delete({ where: { id } })

    return NextResponse.json({ message: "API key deleted" })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    )
  }
}
