import { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  LayoutDashboard,
  Building2,
  Car,
  FileCheck,
  Ban,
  Coins,
  FileText,
  Settings,
  Home,
} from "lucide-react"

function AdminHeader() {
  const t = useTranslations()

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-6">
      <Link href="/admin" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Jongrod" width={40} height={40} />
        <span className="font-bold text-lg">Admin</span>
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

function AdminSidebar() {
  const t = useTranslations("admin")

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: t("dashboard") },
    { href: "/admin/partners", icon: Building2, label: t("partners") },
    { href: "/admin/car-approval", icon: Car, label: t("carApproval") },
    { href: "/admin/doc-approval", icon: FileCheck, label: t("docApproval") },
    { href: "/admin/blacklist", icon: Ban, label: t("blacklist") },
    { href: "/admin/commissions", icon: Coins, label: t("commissions") },
    { href: "/admin/cms/banners", icon: FileText, label: t("cms") },
    { href: "/admin/settings", icon: Settings, label: t("settings") },
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

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}
