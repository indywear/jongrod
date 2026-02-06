"use client"

import { useTranslations } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Globe, User, LogOut, Settings, Car } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { useLocale } from "next-intl"
import { useAuth } from "@/contexts/AuthContext"

export function Navbar() {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const { user, logout, isLoading } = useAuth()

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/cars", label: t("nav.cars") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ]

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale })
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const getDashboardLink = () => {
    if (!user) return "/login"
    if (user.role === "PLATFORM_OWNER") return "/admin"
    if (user.role === "PARTNER_ADMIN") return "/partner"
    return "/profile"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary">Jongrod</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname === link.href ? "text-primary" : "text-muted-foreground"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => switchLocale("th")}
                className={locale === "th" ? "bg-accent" : ""}
              >
                ไทย
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchLocale("en")}
                className={locale === "en" ? "bg-accent" : ""}
              >
                English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{user.firstName} {user.lastName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {user.role === "PARTNER_ADMIN" && (
                  <DropdownMenuItem onClick={() => router.push("/partner")}>
                    <Car className="h-4 w-4 mr-2" />
                    Partner Dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "PLATFORM_OWNER" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "CUSTOMER" && (
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="h-4 w-4 mr-2" />
                    {t("nav.profile")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("common.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">{t("common.login")}</Button>
              </Link>
              <Link href="/register">
                <Button>{t("common.register")}</Button>
              </Link>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-lg font-medium ${pathname === link.href ? "text-primary" : "text-muted-foreground"
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t space-y-2">
                  {user ? (
                    <>
                      <div className="px-2 py-2 bg-muted rounded-lg">
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Link href={getDashboardLink()} className="block">
                        <Button variant="outline" className="w-full">
                          Dashboard
                        </Button>
                      </Link>
                      <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        {t("common.logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block">
                        <Button variant="outline" className="w-full">
                          {t("common.login")}
                        </Button>
                      </Link>
                      <Link href="/register" className="block">
                        <Button className="w-full">{t("common.register")}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
