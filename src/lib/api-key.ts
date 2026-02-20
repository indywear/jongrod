import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const API_KEY_PREFIX = "jgr_"

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex")
}

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const random = crypto.randomBytes(32).toString("hex")
  const key = `${API_KEY_PREFIX}${random}`
  const hash = hashApiKey(key)
  const prefix = key.substring(0, 12) // "jgr_" + 8 chars
  return { key, hash, prefix }
}

export async function validateApiKey(request: NextRequest) {
  const apiKeyHeader = request.headers.get("X-API-Key")

  if (!apiKeyHeader) {
    return null
  }

  const hash = hashApiKey(apiKeyHeader)

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hash },
    include: { partner: true },
  })

  if (!apiKey || !apiKey.isActive) {
    return null
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return null
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {})

  return apiKey
}

export async function requireApiKey(
  request: NextRequest,
  requiredPermissions: string[] = ["read"]
): Promise<
  | { apiKey: Awaited<ReturnType<typeof validateApiKey>>; partnerId: string | null }
  | NextResponse
> {
  const apiKey = await validateApiKey(request)

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid or missing API key. Provide X-API-Key header." },
      { status: 401 }
    )
  }

  // Check permissions
  for (const perm of requiredPermissions) {
    if (!apiKey.permissions.includes(perm)) {
      return NextResponse.json(
        { error: `API key missing required permission: ${perm}` },
        { status: 403 }
      )
    }
  }

  return { apiKey, partnerId: apiKey.partnerId }
}
