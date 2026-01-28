import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  /**
   * @swagger
   * /api/cars/{id}:
   *   get:
   *     summary: Get car details
   *     description: Retrieve detailed information about a specific car by its ID.
   *     tags:
   *       - Cars
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *         description: Car ID
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
   *       500:
   *         description: Internal server error
   */
  try {
    const { id } = await params

    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            phone: true,
            contactEmail: true,
            pickupLocations: true,
            minAdvanceHours: true,
          },
        },
      },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error("Error fetching car:", error)
    return NextResponse.json(
      { error: "Failed to fetch car" },
      { status: 500 }
    )
  }
}
