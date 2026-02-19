"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Globe, Mail, Database } from "lucide-react"
import { siteConfig } from "@/lib/config"

export default function AdminSettingsPage() {
  const t = useTranslations("admin")

  const envChecks = [
    { key: "NEXTAUTH_URL", label: "Site URL" },
    { key: "DATABASE_URL", label: "Database" },
    { key: "RESEND_API_KEY", label: "Email (Resend)" },
    { key: "SUPABASE_URL", label: "Supabase Storage" },
    { key: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("settings")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Site Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Site Name</p>
              <p className="font-medium">{siteConfig.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{siteConfig.company.nameTh}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{siteConfig.company.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{siteConfig.company.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Localization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="default">Thai (th)</Badge>
            <Badge variant="secondary">English (en)</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Environment variables are checked server-side. This page shows client-visible configuration only.
          </p>
          <div className="space-y-2">
            {envChecks.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{item.label}</span>
                <code className="text-xs text-muted-foreground">{item.key}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
