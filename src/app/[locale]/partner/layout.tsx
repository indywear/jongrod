import { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Users,
  Settings,
  Download,
  Upload,
  FileCheck,
  Home,
} from "lucide-react"

function PartnerHeader() {
  const t = useTranslations()

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <Link href="/partner" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Jongrod" width={32} height={32} />
        <span className="font-bold text-lg">Partner</span>
      </Link>
      <Link
        href="/cars"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        {t("nav.home")}
      </Link>
    </header>
  )
}

function PartnerSidebar() {
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
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card min-h-[calc(100vh-64px)]">
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PartnerHeader />
      <div className="flex flex-1">
        <PartnerSidebar />
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}
