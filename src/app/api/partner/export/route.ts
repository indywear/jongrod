import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerId = searchParams.get("partnerId")
    const type = searchParams.get("type") || "bookings"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    if (!partnerId) {
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 }
      )
    }

    let csvContent = ""
    let filename = ""

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
        const pickupDate = booking.pickupDatetime
        const returnDate = booking.returnDatetime
        const createdDate = booking.createdAt
        
        const formatDate = (d: Date) => 
          `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
        
        const row = [
          booking.bookingNumber,
          booking.customerName,
          `'${booking.customerPhone}`,
          booking.customerEmail || "-",
          `${booking.car.brand} ${booking.car.model} ${booking.car.year}`,
          formatDate(pickupDate),
          formatDate(returnDate),
          booking.pickupLocation || "-",
          booking.returnLocation || "-",
          Number(booking.totalPrice),
          booking.leadStatus,
          formatDate(createdDate),
        ]
        csvContent += row.map(cell => `"${cell}"`).join(",") + "\n"
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
          car.brand,
          car.model,
          car.year,
          car.licensePlate,
          car.category,
          car.transmission,
          car.fuelType,
          car.seats,
          car.doors,
          Number(car.pricePerDay),
          car.approvalStatus,
          car.rentalStatus,
        ]
        csvContent += row.map(cell => `"${cell}"`).join(",") + "\n"
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
      
      const formatDate = (d: Date) => 
        `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`
      
      for (const booking of bookings) {
        const row = [
          booking.bookingNumber,
          `${booking.car.brand} ${booking.car.model}`,
          formatDate(booking.pickupDatetime),
          formatDate(booking.returnDatetime),
          Number(booking.totalPrice),
          formatDate(booking.updatedAt),
        ]
        csvContent += row.map(cell => `"${cell}"`).join(",") + "\n"
      }

      csvContent += `\n"รายได้รวม","${totalRevenue}"\n`

      filename = `revenue_${new Date().toISOString().split("T")[0]}.csv`
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
