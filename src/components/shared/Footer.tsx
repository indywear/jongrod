"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { siteConfig } from "@/lib/config"

export function Footer() {
  const t = useTranslations("footer")
  const currentYear = new Date().getFullYear()
  const { company } = siteConfig

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">{siteConfig.name}</h3>
            <p className="text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">{t("links")}</h4>
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
            <h4 className="font-semibold">{t("policies")}</h4>
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
            <h4 className="font-semibold">{t("contactUs")}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">{company.nameEn}</p>
              <p>{company.nameTh}</p>
              <p>{company.address}</p>
              <p>{company.district}</p>
              <p className="pt-2">Tel: {company.phone}</p>
              <p>Email: {company.email}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {siteConfig.name}. {t("copyright")}</p>
        </div>
      </div>
    </footer>
  )
}
