import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

// Types
export type UserRole = "CUSTOMER" | "PARTNER_ADMIN" | "PLATFORM_OWNER"

export interface SessionUser {
  id: string
  email: string | null
  phone: string | null
  firstName: string
  lastName: string
  role: UserRole
  partnerId?: string | null
}

export interface AuthResult {
  user: SessionUser | null
  error: string | null
}

// Constants
const SESSION_COOKIE_NAME = "jongrod_session"
const SESSION_EXPIRY_DAYS = 7

// Generate secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Hash session token for storage
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

// Create session and set cookie
export async function createSession(
  userId: string,
  response: NextResponse
): Promise<string> {
  const token = generateSessionToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  // Store session in database using dedicated Session table
  await prisma.session.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt,
    },
  })

  // Set HTTP-only cookie with SameSite=Strict for CSRF protection
  response.cookies.set(SESSION_COOKIE_NAME, `${userId}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  })

  return token
}

// Get session from request
export async function getSession(request: NextRequest): Promise<AuthResult> {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)

    if (!cookie?.value) {
      return { user: null, error: "No session found" }
    }

    const [userId, token] = cookie.value.split(":")

    if (!userId || !token) {
      return { user: null, error: "Invalid session format" }
    }

    // Verify session token in database
    const hashedToken = hashToken(token)
    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
    })

    if (!session || session.userId !== userId || session.expiresAt < new Date()) {
      return { user: null, error: "Invalid or expired session" }
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerAdmins: {
          select: { partnerId: true },
          take: 1,
        }
      }
    })

    if (!user) {
      return { user: null, error: "User not found" }
    }

    if (user.isBlacklisted) {
      return { user: null, error: "Account is blacklisted" }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        partnerId: user.partnerAdmins?.[0]?.partnerId || null,
      },
      error: null,
    }
  } catch (error) {
    console.error("Session verification error:", error)
    return { user: null, error: "Session verification failed" }
  }
}

// Clear session cookie and delete from database
export async function clearSession(
  response: NextResponse,
  request?: NextRequest
): Promise<void> {
  // Delete session from database if we have the token
  if (request) {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (cookie?.value) {
      const [, token] = cookie.value.split(":")
      if (token) {
        const hashedToken = hashToken(token)
        await prisma.session.deleteMany({ where: { token: hashedToken } }).catch(() => {})
      }
    }
  }

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  })
}

// Middleware helper: Require authentication
export async function requireAuth(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  const { user, error } = await getSession(request)

  if (!user) {
    return NextResponse.json(
      { error: error || "Unauthorized" },
      { status: 401 }
    )
  }

  return { user }
}

// Middleware helper: Require specific role
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requireAuth(request)

  if (result instanceof NextResponse) {
    return result
  }

  if (!allowedRoles.includes(result.user.role)) {
    return NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    )
  }

  return result
}

// Middleware helper: Require admin role
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  return requireRole(request, ["PLATFORM_OWNER"])
}

// Middleware helper: Require partner role
export async function requirePartner(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  return requireRole(request, ["PARTNER_ADMIN", "PLATFORM_OWNER"])
}

// Middleware helper: Require customer or higher
export async function requireCustomer(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  return requireRole(request, ["CUSTOMER", "PARTNER_ADMIN", "PLATFORM_OWNER"])
}

// Verify partner ownership
export async function verifyPartnerOwnership(
  request: NextRequest,
  partnerId: string
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requirePartner(request)

  if (result instanceof NextResponse) {
    return result
  }

  // Platform owner can access all partners
  if (result.user.role === "PLATFORM_OWNER") {
    return result
  }

  // Partner admin can only access their own partner
  if (result.user.partnerId !== partnerId) {
    return NextResponse.json(
      { error: "Forbidden: Not authorized for this partner" },
      { status: 403 }
    )
  }

  return result
}

// Verify user ownership (for customer routes)
export async function verifyUserOwnership(
  request: NextRequest,
  userId: string
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requireAuth(request)

  if (result instanceof NextResponse) {
    return result
  }

  // Admin can access all users
  if (result.user.role === "PLATFORM_OWNER") {
    return result
  }

  // Users can only access their own data
  if (result.user.id !== userId) {
    return NextResponse.json(
      { error: "Forbidden: Not authorized to access this resource" },
      { status: 403 }
    )
  }

  return result
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true }
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  record.count++
  return { allowed: true }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)
