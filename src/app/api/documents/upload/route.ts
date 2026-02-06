import { NextRequest, NextResponse } from "next/server"
import { uploadFile } from "@/lib/storage"
import { prisma } from "@/lib/prisma"
import { sendBookingNotification } from "@/lib/telegram"
import { getSession } from "@/lib/auth"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function validateFile(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "ไฟล์ต้องเป็น JPEG, PNG หรือ WebP เท่านั้น" }
  }
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "ขนาดไฟล์ต้องไม่เกิน 10MB" }
  }
  return { valid: true }
}

export async function POST(request: NextRequest) {
  // Check if user is logged in
  const session = await getSession(request)

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

    // Validate file types and sizes
    const idCardFrontValidation = validateFile(idCardFront)
    if (!idCardFrontValidation.valid) {
      return NextResponse.json(
        { error: `บัตรประชาชนด้านหน้า: ${idCardFrontValidation.error}` },
        { status: 400 }
      )
    }

    const driverLicenseValidation = validateFile(driverLicense)
    if (!driverLicenseValidation.valid) {
      return NextResponse.json(
        { error: `ใบขับขี่: ${driverLicenseValidation.error}` },
        { status: 400 }
      )
    }

    if (idCardBack) {
      const idCardBackValidation = validateFile(idCardBack)
      if (!idCardBackValidation.valid) {
        return NextResponse.json(
          { error: `บัตรประชาชนด้านหลัง: ${idCardBackValidation.error}` },
          { status: 400 }
        )
      }
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

    // Verify booking ownership - if user is logged in, check they own this booking
    // If booking has a userId, only that user can upload documents
    // If booking doesn't have userId (guest booking), allow upload based on bookingId
    if (booking.userId) {
      if (!session) {
        return NextResponse.json(
          { error: "กรุณาเข้าสู่ระบบเพื่ออัปโหลดเอกสาร" },
          { status: 401 }
        )
      }
      if (booking.userId !== session.id) {
        return NextResponse.json(
          { error: "คุณไม่มีสิทธิ์อัปโหลดเอกสารสำหรับการจองนี้" },
          { status: 403 }
        )
      }
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

    // Save document records to database
    const userId = session?.id || booking.userId
    if (userId) {
      const documentRecords = []

      documentRecords.push({
        userId,
        type: "ID_CARD" as const,
        url: uploadedUrls.idCardFront,
        status: "PENDING" as const,
      })

      if (uploadedUrls.idCardBack) {
        documentRecords.push({
          userId,
          type: "ID_CARD" as const,
          url: uploadedUrls.idCardBack,
          status: "PENDING" as const,
        })
      }

      documentRecords.push({
        userId,
        type: "DRIVER_LICENSE" as const,
        url: uploadedUrls.driverLicense,
        status: "PENDING" as const,
      })

      await prisma.document.createMany({
        data: documentRecords,
      })
    }

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
