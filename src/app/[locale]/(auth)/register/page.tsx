"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const t = useTranslations("auth")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    // Thai phone format: 08x-xxx-xxxx or 0xxxxxxxxx
    const phoneRegex = /^0[689]\d{8}$/
    const cleanPhone = phone.replace(/[-\s]/g, "")
    return phoneRegex.test(cleanPhone)
  }

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    if (password.length < 8) errors.push("ต้องมีอย่างน้อย 8 ตัวอักษร")
    if (!/[A-Z]/.test(password)) errors.push("ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
    if (!/[a-z]/.test(password)) errors.push("ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว")
    if (!/[0-9]/.test(password)) errors.push("ต้องมีตัวเลขอย่างน้อย 1 ตัว")
    return { valid: errors.length === 0, errors }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({ ...formData, [id]: value })
    setError("")
    // Clear field error when user types
    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: "" }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const errors = { ...fieldErrors }

    if (id === "email" && value && !validateEmail(value)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง"
    }
    if (id === "phone" && value && !validatePhone(value)) {
      errors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)"
    }
    if (id === "password" && value) {
      const validation = validatePassword(value)
      if (!validation.valid) {
        errors.password = `รหัสผ่าน: ${validation.errors.join(", ")}`
      }
    }
    if (id === "confirmPassword" && value && value !== formData.password) {
      errors.confirmPassword = "รหัสผ่านไม่ตรงกัน"
    }

    setFieldErrors(errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate all fields
    if (!validateEmail(formData.email)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง")
      return
    }

    if (!validatePhone(formData.phone)) {
      setError("รูปแบบเบอร์โทรไม่ถูกต้อง")
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      setError(`รหัสผ่านไม่ผ่านเงื่อนไข: ${passwordValidation.errors.join(", ")}`)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่")
        return
      }

      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ")
      router.push("/login")
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
          <CardTitle className="text-2xl">{t("registerTitle")}</CardTitle>
          <CardDescription>
            สร้างบัญชีเพื่อเริ่มจองรถ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("firstName")}</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("lastName")}</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0812345678"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={fieldErrors.phone ? "border-red-500" : ""}
              />
              {fieldErrors.phone && (
                <p className="text-xs text-red-500">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={fieldErrors.password ? "border-red-500" : ""}
              />
              {fieldErrors.password ? (
                <p className="text-xs text-red-500">{fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className={fieldErrors.confirmPassword ? "border-red-500" : ""}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "กำลังสมัคร..." : t("registerButton")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t("hasAccount")} </span>
            <Link href="/login" className="text-primary hover:underline">
              {t("loginButton")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
