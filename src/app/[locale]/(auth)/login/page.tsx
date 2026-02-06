"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [loginType, setLoginType] = useState<"email" | "phone">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^0[689]\d{8}$/
    const cleanPhone = phone.replace(/[-\s]/g, "")
    return phoneRegex.test(cleanPhone)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Client-side validation
    if (loginType === "email") {
      if (!formData.email) {
        setError("กรุณากรอกอีเมล")
        return
      }
      if (!validateEmail(formData.email)) {
        setError("รูปแบบอีเมลไม่ถูกต้อง")
        return
      }
    } else {
      if (!formData.phone) {
        setError("กรุณากรอกเบอร์โทร")
        return
      }
      if (!validatePhone(formData.phone)) {
        setError("รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)")
        return
      }
    }

    if (!formData.password) {
      setError("กรุณากรอกรหัสผ่าน")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginType === "email" ? formData.email : undefined,
          phone: loginType === "phone" ? formData.phone : undefined,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่")
        return
      }

      // Refresh auth context to get user from session cookie
      await refreshUser()

      if (data.user.role === "PLATFORM_OWNER") {
        router.push("/admin")
      } else if (data.user.role === "PARTNER_ADMIN") {
        router.push("/partner")
      } else {
        router.push("/")
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
          <CardDescription>
            เข้าสู่ระบบเพื่อจัดการการจองของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as "email" | "phone")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">{t("email")}</TabsTrigger>
              <TabsTrigger value="phone">{t("phone")}</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <TabsContent value="email" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required={loginType === "email"}
                  />
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={formData.phone}
                    onChange={handleChange}
                    required={loginType === "phone"}
                  />
                </div>
              </TabsContent>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "กำลังเข้าสู่ระบบ..." : t("loginButton")}
              </Button>
            </form>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t("noAccount")} </span>
            <Link href="/register" className="text-primary hover:underline">
              {t("registerButton")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
