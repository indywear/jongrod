import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { user, error } = await getSession(request)

  if (!user) {
    return NextResponse.json(
      { error: error || "Not authenticated" },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
