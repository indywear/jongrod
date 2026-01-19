import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/storage"
import { prisma } from "@/lib/prisma"
import { sendBookingNotification } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const bookingId = formData.get("bookingId") as string
    const customerName = formData.get("customerName") as string
    const idCardFront = formData.get("idCardFront") as File | null
    const idCardBack = formData.get("idCardBack") as File | null
    const driverLicense = formData.get("driverLicense") as File | null

    if (!bookingId || !customerName) {
      return NextResponse.json(
        { error: "Missing bookingId or customerName" },
        { status: 400 }
      )
    }

    if (!idCardFront || !driverLicense) {
      return NextResponse.json(
        { error: "กรุณาอัปโหลดรูปบัตรประชาชนด้านหน้าและใบขับขี่" },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        car: true,
        partner: {
          select: { telegramChatId: true },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    const uploadedUrls: Record<string, string> = {}
    const timestamp = Date.now()
    const sanitizedName = customerName.replace(/[^a-zA-Z0-9ก-๙]/g, "_")

    const idCardFrontBuffer = Buffer.from(await idCardFront.arrayBuffer())
    const idCardFrontPath = `bookings/${bookingId}/${sanitizedName}_id_front_${timestamp}.${getFileExtension(idCardFront.name)}`
    const idCardFrontResult = await uploadFile(
      "documents",
      idCardFrontPath,
      idCardFrontBuffer,
      idCardFront.type
    )
    if (idCardFrontResult.error) {
      return NextResponse.json(
        { error: `Failed to upload ID card front: ${idCardFrontResult.error}` },
        { status: 500 }
      )
    }
    uploadedUrls.idCardFront = idCardFrontResult.url!

    if (idCardBack) {
      const idCardBackBuffer = Buffer.from(await idCardBack.arrayBuffer())
      const idCardBackPath = `bookings/${bookingId}/${sanitizedName}_id_back_${timestamp}.${getFileExtension(idCardBack.name)}`
      const idCardBackResult = await uploadFile(
        "documents",
        idCardBackPath,
        idCardBackBuffer,
        idCardBack.type
      )
      if (idCardBackResult.error) {
        return NextResponse.json(
          { error: `Failed to upload ID card back: ${idCardBackResult.error}` },
          { status: 500 }
        )
      }
      uploadedUrls.idCardBack = idCardBackResult.url!
    }

    const driverLicenseBuffer = Buffer.from(await driverLicense.arrayBuffer())
    const driverLicensePath = `bookings/${bookingId}/${sanitizedName}_license_${timestamp}.${getFileExtension(driverLicense.name)}`
    const driverLicenseResult = await uploadFile(
      "documents",
      driverLicensePath,
      driverLicenseBuffer,
      driverLicense.type
    )
    if (driverLicenseResult.error) {
      return NextResponse.json(
        { error: `Failed to upload driver license: ${driverLicenseResult.error}` },
        { status: 500 }
      )
    }
    uploadedUrls.driverLicense = driverLicenseResult.url!

    if (booking.partner.telegramChatId) {
      sendBookingNotification(booking.partner.telegramChatId, {
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName || customerName,
        customerPhone: booking.customerPhone || "",
        carBrand: booking.car.brand,
        carModel: booking.car.model,
        carYear: booking.car.year,
        pickupDatetime: booking.pickupDatetime,
        returnDatetime: booking.returnDatetime,
        pickupLocation: booking.pickupLocation || "",
        totalPrice: Number(booking.totalPrice),
      }).catch((err) => {
        console.error("Failed to send Telegram notification:", err)
      })
    }

    return NextResponse.json({
      success: true,
      documents: uploadedUrls,
    })
  } catch (error) {
    console.error("Error uploading documents:", error)
    return NextResponse.json(
      { error: "Failed to upload documents" },
      { status: 500 }
    )
  }
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "jpg"
}
