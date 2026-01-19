import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: today,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        bookingNumber: true,
        customerName: true,
        createdAt: true,
        leadStatus: true,
        car: {
          select: {
            brand: true,
            model: true,
          },
        },
        partner: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Error fetching recent bookings:", error)
    return NextResponse.json({ bookings: [] })
  }
}
