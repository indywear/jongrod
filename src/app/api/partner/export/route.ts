import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"

// Escape CSV value to prevent CSV injection
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  // Remove dangerous characters that could be used for formula injection
  const sanitized = str.replace(/^[=+\-@\t\r]/, "'$&")
  // Escape quotes and wrap in quotes
  return `"${sanitized.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId") || authResult.user.partnerId
    const type = searchParams.get("type") || "bookings"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, partnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    // Validate date formats
    if (dateFrom && isNaN(new Date(dateFrom).getTime())) {
      return NextResponse.json(
        { error: "Invalid dateFrom format" },
        { status: 400 }
      )
    }
    if (dateTo && isNaN(new Date(dateTo).getTime())) {
      return NextResponse.json(
        { error: "Invalid dateTo format" },
        { status: 400 }
      )
    }

    let csvContent = ""
    let filename = ""

    const formatDate = (d: Date) =>
      `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`

    if (type === "bookings") {
      const where: Record<string, unknown> = { partnerId }

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) {
          (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
        }
        if (dateTo) {
          const endDate = new Date(dateTo)
          endDate.setHours(23, 59, 59, 999)
          ;(where.createdAt as Record<string, unknown>).lte = endDate
        }
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
        },
      })

      csvContent = "เลขที่จอง,ชื่อลูกค้า,เบอร์โทร,อีเมล,รถ,วันรับรถ,วันคืนรถ,สถานที่รับ,สถานที่คืน,ราคารวม,สถานะ,วันที่จอง\n"

      for (const booking of bookings) {
        const row = [
          escapeCSV(booking.bookingNumber),
          escapeCSV(booking.customerName),
          escapeCSV(booking.customerPhone),
          escapeCSV(booking.customerEmail || "-"),
          escapeCSV(`${booking.car.brand} ${booking.car.model} ${booking.car.year}`),
          escapeCSV(formatDate(booking.pickupDatetime)),
          escapeCSV(formatDate(booking.returnDatetime)),
          escapeCSV(booking.pickupLocation || "-"),
          escapeCSV(booking.returnLocation || "-"),
          escapeCSV(Number(booking.totalPrice)),
          escapeCSV(booking.leadStatus),
          escapeCSV(formatDate(booking.createdAt)),
        ]
        csvContent += row.join(",") + "\n"
      }

      filename = `bookings_${new Date().toISOString().split("T")[0]}.csv`
    } else if (type === "cars") {
      const cars = await prisma.car.findMany({
        where: { partnerId },
        orderBy: { createdAt: "desc" },
      })

      csvContent = "ยี่ห้อ,รุ่น,ปี,ทะเบียน,ประเภท,เกียร์,เชื้อเพลิง,ที่นั่ง,ประตู,ราคา/วัน,สถานะอนุมัติ,สถานะเช่า\n"

      for (const car of cars) {
        const row = [
          escapeCSV(car.brand),
          escapeCSV(car.model),
          escapeCSV(car.year),
          escapeCSV(car.licensePlate),
          escapeCSV(car.category),
          escapeCSV(car.transmission),
          escapeCSV(car.fuelType),
          escapeCSV(car.seats),
          escapeCSV(car.doors),
          escapeCSV(Number(car.pricePerDay)),
          escapeCSV(car.approvalStatus),
          escapeCSV(car.rentalStatus),
        ]
        csvContent += row.join(",") + "\n"
      }

      filename = `cars_${new Date().toISOString().split("T")[0]}.csv`
    } else if (type === "revenue") {
      const where: Record<string, unknown> = {
        partnerId,
        leadStatus: "COMPLETED",
      }

      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) {
          (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
        }
        if (dateTo) {
          const endDate = new Date(dateTo)
          endDate.setHours(23, 59, 59, 999)
          ;(where.createdAt as Record<string, unknown>).lte = endDate
        }
      }

      const bookings = await prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          car: {
            select: {
              brand: true,
              model: true,
            },
          },
        },
      })

      const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalPrice), 0)

      csvContent = "เลขที่จอง,รถ,วันรับ,วันคืน,ราคารวม,วันที่เสร็จสิ้น\n"

      for (const booking of bookings) {
        const row = [
          escapeCSV(booking.bookingNumber),
          escapeCSV(`${booking.car.brand} ${booking.car.model}`),
          escapeCSV(formatDate(booking.pickupDatetime)),
          escapeCSV(formatDate(booking.returnDatetime)),
          escapeCSV(Number(booking.totalPrice)),
          escapeCSV(formatDate(booking.updatedAt)),
        ]
        csvContent += row.join(",") + "\n"
      }

      csvContent += `\n${escapeCSV("รายได้รวม")},${escapeCSV(totalRevenue)}\n`

      filename = `revenue_${new Date().toISOString().split("T")[0]}.csv`
    } else {
      return NextResponse.json(
        { error: "Invalid export type" },
        { status: 400 }
      )
    }

    const bom = "\uFEFF"
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
