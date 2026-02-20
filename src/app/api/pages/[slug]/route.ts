import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * @swagger
 * /api/pages/{slug}:
 *   get:
 *     tags:
 *       - Content
 *     summary: Get page by slug
 *     description: Retrieves a single published page by its URL slug.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Page URL slug
 *     responses:
 *       200:
 *         description: Page details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: object
 *       404:
 *         description: Page not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const page = await prisma.page.findUnique({
      where: { slug, isPublished: true },
    })

    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error("Error fetching page:", error)
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    )
  }
}
