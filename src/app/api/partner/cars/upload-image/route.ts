import { NextRequest, NextResponse } from "next/server"
import { uploadCarImage } from "@/lib/storage"
import { requirePartner, verifyPartnerOwnership } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  // Require partner role
  const authResult = await requirePartner(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const formData = await request.formData()

    const file = formData.get("file") as File | null
    const partnerId = formData.get("partnerId") as string
    const carId = formData.get("carId") as string

    const targetPartnerId = partnerId || authResult.user.partnerId

    if (!file || !targetPartnerId || !carId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify partner ownership
    const ownershipResult = await verifyPartnerOwnership(request, targetPartnerId)
    if (ownershipResult instanceof NextResponse) {
      return ownershipResult
    }

    // Verify the car belongs to this partner
    const car = await prisma.car.findUnique({
      where: { id: carId },
    })

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      )
    }

    if (car.partnerId !== targetPartnerId) {
      return NextResponse.json(
        { error: "Not authorized to upload images for this car" },
        { status: 403 }
      )
    }

    // Validate file type (check MIME type, not just file extension)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Sanitize filename
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")

    const result = await uploadCarImage(
      targetPartnerId,
      carId,
      buffer,
      sanitizedFilename,
      file.type
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: result.url })
  } catch (error) {
    console.error("Error uploading car image:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
