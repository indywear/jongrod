import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Jongrod - เช่ารถออนไลน์",
    template: "%s | Jongrod",
  },
  description: "ระบบเช่ารถออนไลน์ที่ครบวงจร เปรียบเทียบราคาจากหลายร้านในที่เดียว",
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
