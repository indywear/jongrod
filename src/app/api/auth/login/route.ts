import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, password } = body

    if ((!email && !phone) || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมล/เบอร์โทร และรหัสผ่าน" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: email ? { email } : { phone },
    })

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้นี้" },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      )
    }

    if (user.isBlacklisted) {
      return NextResponse.json(
        { error: "บัญชีของคุณถูกระงับการใช้งาน" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    })
  } catch (error) {
    console.error("Error logging in:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" },
      { status: 500 }
    )
  }
}
