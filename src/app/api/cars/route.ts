
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
        const page = parseInt(searchParams.get("page") || "1")
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Max 100 per page
        const skip = (page - 1) * limit

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {
            rentalStatus: "AVAILABLE",
            approvalStatus: "APPROVED"
        }

        if (category) {
            where.category = category
        }

        const [cars, total] = await Promise.all([
            prisma.car.findMany({
                where,
                orderBy: { createdAt: "desc" },
                include: {
                    partner: {
                        select: {
                            name: true,
                            logoUrl: true
                        }
                    }
                },
                skip,
                take: limit,
            }),
            prisma.car.count({ where }),
        ])

        const carsWithUrls = cars.map((car) => ({
            ...car,
            images: Array.isArray(car.images)
                ? (car.images as string[]).map((img) => {
                    // If it's a Supabase URL with uploads/, extract and use local path
                    if (img.includes("supabase.co") && img.includes("/uploads/")) {
                        const match = img.match(/\/uploads\/.*$/)
                        if (match) return match[0]
                    }
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
        }))

        return NextResponse.json({
            cars: carsWithUrls,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error("Error fetching cars:", error)
        return NextResponse.json(
            { error: "Failed to fetch cars" },
            { status: 500 }
        )
    }
}
