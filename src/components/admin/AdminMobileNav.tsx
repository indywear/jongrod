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
  Building2,
  Car,
  FileCheck,
  Ban,
  Coins,
  FileText,
  Settings,
  KeyRound,
  ClipboardList,
  Menu,
} from "lucide-react"

export function AdminMobileNav() {
  const t = useTranslations("admin")

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/admin/partners", icon: Building2, label: t("partners") },
    { href: "/admin/leads", icon: ClipboardList, label: t("leads") },
    { href: "/admin/car-approval", icon: Car, label: t("carApproval") },
    { href: "/admin/doc-approval", icon: FileCheck, label: t("docApproval") },
    { href: "/admin/blacklist", icon: Ban, label: t("blacklist") },
    { href: "/admin/commissions", icon: Coins, label: t("commissions") },
    { href: "/admin/cms/banners", icon: FileText, label: t("cms") },
    { href: "/admin/api-keys", icon: KeyRound, label: t("apiKeys") },
    { href: "/admin/settings", icon: Settings, label: t("settings") },
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
          <span className="font-bold text-lg">เมนู Admin</span>
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
