
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import { getPublicUrl } from "@/lib/storage"

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: List all cars
 *     description: Retrieve a paginated list of available cars with optional filters.
 *     tags:
 *       - Cars
 *     parameters:
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [SEDAN, SUV, VAN, PICKUP, LUXURY, COMPACT, MOTORCYCLE]
 *         description: Filter by car category
 *     responses:
 *       200:
 *         description: List of cars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get("category")

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            rentalStatus: "AVAILABLE",
            approvalStatus: "APPROVED"
        }

        if (category) {
            where.category = category
        }

        const cars = await prisma.car.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                partner: {
                    select: {
                        name: true,
                        logoUrl: true
                    }
                }
            }
        })

        const carsWithUrls = cars.map((car) => ({
            ...car,
            images: Array.isArray(car.images)
                ? (car.images as string[]).map((img) =>
                    img.startsWith("http") ? img : getPublicUrl("car-images", img)
                )
                : [],
            partner: {
                ...car.partner,
                logoUrl: car.partner.logoUrl
                    ? car.partner.logoUrl.startsWith("http")
                        ? car.partner.logoUrl
                        : getPublicUrl("avatars", car.partner.logoUrl)
                    : null,
            },
        }))

        return NextResponse.json({ cars: carsWithUrls })
    } catch (error) {
        console.error("Error fetching cars:", error)
        return NextResponse.json(
            { error: "Failed to fetch cars" },
            { status: 500 }
        )
    }
}
