import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireApiKey } from "@/lib/api-key"
import { getPublicUrl } from "@/lib/storage"

/**
 * @swagger
 * /api/v1/cars/{id}:
 *   get:
 *     summary: Get car details (external API)
 *     description: Returns full details of a specific car including rental status and partner info.
 *     tags:
 *       - External Cars
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 car:
 *                   $ref: '#/components/schemas/Car'
 *       404:
 *         description: Car not found
 *       401:
 *         description: Invalid or missing API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKeyResult = await requireApiKey(request, ["read"])
  if (apiKeyResult instanceof NextResponse) return apiKeyResult

  try {
    const { id } = await params

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { id, approvalStatus: "APPROVED" }

    // If API key is tied to a partner, restrict to their cars
    if (apiKeyResult.partnerId) {
      where.partnerId = apiKeyResult.partnerId
    }

    const car = await prisma.car.findFirst({
      where,
      include: {
        partner: {
          select: { id: true, name: true, logoUrl: true, phone: true, contactEmail: true },
        },
      },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    const carWithUrls = {
      ...car,
      images: Array.isArray(car.images)
        ? (car.images as string[]).map((img) => {
            if (img.includes("supabase.co") && img.includes("/uploads/")) {
              const match = img.match(/\/uploads\/.*$/)
              if (match) return match[0]
            }
            if (img.startsWith("/uploads/")) return img
            if (img.startsWith("http")) return img
            if (img.startsWith("uploads/")) return `/${img}`
            return getPublicUrl("car-images", img)
          })
        : [],
      partner: {
        ...car.partner,
        logoUrl: car.partner.logoUrl
          ? car.partner.logoUrl.startsWith("http")
            ? car.partner.logoUrl
            : getPublicUrl("avatars", car.partner.logoUrl)
          : null,
      },
    }

    return NextResponse.json({ car: carWithUrls })
  } catch (error) {
    console.error("V1 car detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch car" },
      { status: 500 }
    )
  }
}
