"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Users,
  Settings,
  Download,
  Upload,
  FileCheck,
  Menu,
} from "lucide-react"

export function PartnerMobileNav() {
  const t = useTranslations("partner")

  const navItems = [
    { href: "/partner", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/partner/cars", icon: Car, label: t("cars") },
    { href: "/partner/leads", icon: ClipboardList, label: t("leads") },
    { href: "/partner/doc-approval", icon: FileCheck, label: t("docApproval") },
    { href: "/partner/team", icon: Users, label: t("team") },
    { href: "/partner/settings", icon: Settings, label: t("settings") },
    { href: "/partner/import", icon: Upload, label: "Import" },
    { href: "/partner/export", icon: Download, label: t("export") },
  ]

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="p-4 border-b">
          <span className="font-bold text-lg">Partner Menu</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
