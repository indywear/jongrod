import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
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

    const buffer = Buffer.from(await image.arrayBuffer())
    const path = `banners/${Date.now()}_${image.name}`

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
