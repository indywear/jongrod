import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { generateApiKey } from "@/lib/api-key"
import { z } from "zod"

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  partnerId: z.string().optional(),
  permissions: z.array(z.enum(["read", "write", "login"])).min(1),
  expiresAt: z.string().optional(),
})

/**
 * @swagger
 * /api/admin/api-keys:
 *   get:
 *     summary: List all API keys
 *     description: Returns all API keys (admin only). Shows prefix, not full key.
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new API key
 *     description: Generate a new API key. The full key is only shown once in the response.
 *     tags:
 *       - API Keys
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - permissions
 *             properties:
 *               name:
 *                 type: string
 *               partnerId:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [read, write, login]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: API key created (full key shown only once)
 *       400:
 *         description: Validation error
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        partner: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Error listing API keys:", error)
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const validation = createKeySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, partnerId, permissions, expiresAt } = validation.data

    // Validate partner exists if provided
    if (partnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
      if (!partner) {
        return NextResponse.json(
          { error: "Partner not found" },
          { status: 400 }
        )
      }
    }

    const { key, hash, prefix } = generateApiKey()

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hash,
        prefix,
        partnerId: partnerId || null,
        permissions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        partner: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        apiKey,
        plainTextKey: key, // Only shown once!
        message: "Save this key now. It will not be shown again.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    )
  }
}
