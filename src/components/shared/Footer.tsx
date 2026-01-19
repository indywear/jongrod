"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

export function Footer() {
  const t = useTranslations("footer")
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Jongrod</h3>
            <p className="text-sm text-muted-foreground">
              ระบบเช่ารถออนไลน์ที่ครบวงจร
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">ลิงก์</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary">
                {t("about")}
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">
                {t("contact")}
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">นโยบาย</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                {t("terms")}
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                {t("privacy")}
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">ติดต่อ</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Meprompt Selective Co.,Ltd</p>
              <p>บจก. มีพรอมท์ ซีเลคทีฟ (สำนักงานใหญ่)</p>
              <p>25/9 ชั้น2 ลาดพร้าว ซอย1แยก11</p>
              <p>จอมพล จตุจักร กทม 10900</p>
              <p>ID: 0125556023513</p>
              <p className="pt-2">Tel: 02-054-6619</p>
              <p>Email: koondyasdw@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Jongrod. {t("copyright")}</p>
        </div>
      </div>
    </footer>
  )
}
