import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function GET(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const banners = await prisma.banner.findMany({
      orderBy: [
        { position: "asc" },
        { sortOrder: "asc" },
      ],
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error("Error fetching banners:", error)
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const formData = await request.formData()
    const title = formData.get("title") as string
    const image = formData.get("image") as File
    const linkUrl = formData.get("linkUrl") as string | null
    const position = formData.get("position") as string
    const sortOrder = formData.get("sortOrder") as string | null
    const startDate = formData.get("startDate") as string | null
    const endDate = formData.get("endDate") as string | null
    const isActive = formData.get("isActive") === "true"

    if (!title || !image || !position) {
      return NextResponse.json(
        { error: "Title, image, and position are required" },
        { status: 400 }
      )
    }

    // Validate image type
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Invalid image type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      )
    }

    // Validate file size
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image size must be less than 5MB" },
        { status: 400 }
      )
    }

    // Validate position
    const validPositions = ["HOMEPAGE_HERO", "HOMEPAGE_MIDDLE", "LISTING_TOP", "POPUP"]
    if (!validPositions.includes(position)) {
      return NextResponse.json(
        { error: "Invalid position" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await image.arrayBuffer())
    // Sanitize filename
    const sanitizedFilename = image.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const path = `banners/${Date.now()}_${sanitizedFilename}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("banners")
      .upload(path, buffer, {
        contentType: image.type,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("banners")
      .getPublicUrl(path)

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl: urlData.publicUrl,
        linkUrl,
        position: position as "HOMEPAGE_HERO" | "HOMEPAGE_MIDDLE" | "LISTING_TOP" | "POPUP",
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive,
      },
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error) {
    console.error("Error creating banner:", error)
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    )
  }
}
