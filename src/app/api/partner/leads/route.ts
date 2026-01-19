import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")
    const status = searchParams.get("status")

    if (!partnerId) {
      return NextResponse.json({ leads: [] })
    }

    const where: Record<string, unknown> = { partnerId }
    
    if (status) {
      where.leadStatus = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        car: {
          select: {
            brand: true,
            model: true,
            year: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    const blacklistEntries = await prisma.blacklist.findMany({
      select: {
        documentNumber: true,
        phone: true,
        fullName: true,
      },
    })
    
    const blacklistPhones = new Set(blacklistEntries.map(b => b.phone).filter(Boolean))
    const blacklistNames = new Set(blacklistEntries.map(b => b.fullName.toLowerCase()))

    const leads = bookings.map((booking) => {
      const customerName = booking.user 
        ? `${booking.user.firstName} ${booking.user.lastName}`
        : booking.customerName || "ลูกค้า"
      const customerPhone = booking.user?.phone || booking.customerPhone || "-"
      
      const isBlacklisted = blacklistPhones.has(customerPhone) || 
                           blacklistNames.has(customerName.toLowerCase())
      
      return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName,
        customerPhone,
        customerEmail: booking.customerEmail,
        car: `${booking.car.brand} ${booking.car.model} ${booking.car.year}`,
        pickupDate: booking.pickupDatetime.toISOString().split("T")[0],
        returnDate: booking.returnDatetime.toISOString().split("T")[0],
        pickupLocation: booking.pickupLocation,
        returnLocation: booking.returnLocation,
        customerNote: booking.customerNote,
        totalPrice: Number(booking.totalPrice),
        status: booking.leadStatus,
        isBlacklisted,
      }
    })

    return NextResponse.json({ leads })
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json({ leads: [] })
  }
}
