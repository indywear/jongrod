"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function ContactPage() {
  const t = useTranslations()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("footer.contact")}</h1>
          <p className="text-xl text-muted-foreground">
            มีคำถามหรือต้องการความช่วยเหลือ? ติดต่อเราได้เลย
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">ที่อยู่</h3>
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Meprompt Selective Co.,Ltd</span>
                      <br />
                      บจก. มีพรอมท์ ซีเลคทีฟ (สำนักงานใหญ่)
                      <br />
                      25/9 ชั้น2 ลาดพร้าว ซอย1แยก11
                      <br />
                      จอมพล จตุจักร กทม 10900
                      <br />
                      <span className="text-sm">ID: 0125556023513</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">โทรศัพท์</h3>
                    <p className="text-muted-foreground">02-054-6619</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">อีเมล</h3>
                    <p className="text-muted-foreground">koondyasdw@gmail.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">เวลาทำการ</h3>
                    <p className="text-muted-foreground">
                      จันทร์ - ศุกร์: 08:00 - 18:00
                    </p>
                    <p className="text-muted-foreground">
                      เสาร์ - อาทิตย์: 09:00 - 17:00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ส่งข้อความถึงเรา</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ชื่อ</Label>
                    <Input required />
                  </div>
                  <div className="space-y-2">
                    <Label>นามสกุล</Label>
                    <Input required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>เบอร์โทร</Label>
                  <Input type="tel" />
                </div>
                <div className="space-y-2">
                  <Label>หัวข้อ</Label>
                  <Input required />
                </div>
                <div className="space-y-2">
                  <Label>ข้อความ</Label>
                  <Textarea rows={4} required />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "กำลังส่ง..." : "ส่งข้อความ"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
