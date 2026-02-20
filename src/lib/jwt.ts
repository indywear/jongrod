import { SignJWT, jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "jongrod-jwt-secret-change-in-production"
)
const JWT_EXPIRY = "24h"

export interface JwtPayload {
  sub: string
  email: string | null
  phone: string | null
  firstName: string
  lastName: string
  role: string
  partnerId: string | null
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setIssuer("jongrod")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "jongrod",
    })
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export async function requireBearerToken(
  request: NextRequest
): Promise<{ user: JwtPayload } | NextResponse> {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header. Use: Bearer <token>" },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    )
  }

  return { user: payload }
}
