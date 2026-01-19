import { ReactNode } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Building2,
  Car,
  FileCheck,
  Ban,
  Coins,
  FileText,
  Settings,
} from "lucide-react"

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
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg">Admin Panel</h2>
      </div>
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
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-6 lg:p-8">{children}</div>
    </div>
  )
}
