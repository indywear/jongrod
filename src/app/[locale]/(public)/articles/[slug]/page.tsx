"use client"

import { useState, useEffect } from "react"
import { useLocale } from "next-intl"
import { useParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, Loader2 } from "lucide-react"
import Image from "next/image"

interface ArticleDetail {
  id: string
  slug: string
  titleTh: string
  titleEn: string
  contentTh: string
  contentEn: string
  featuredImage: string | null
  category: string | null
  publishedAt: string | null
  author: { firstName: string; lastName: string; avatarUrl: string | null }
}

export default function ArticleDetailPage() {
  const locale = useLocale()
  const params = useParams()
  const slug = params.slug as string
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) fetchArticle()
  }, [slug])

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${slug}`)
      if (res.ok) {
        const data = await res.json()
        setArticle(data.article)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground mb-4">ไม่พบบทความ</p>
        <Link href="/articles" className="text-primary hover:underline">
          กลับหน้าบทความ
        </Link>
      </div>
    )
  }

  const title = locale === "en" ? article.titleEn : article.titleTh
  const content = locale === "en" ? article.contentEn : article.contentTh

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/articles"
        className="inline-flex items-center text-muted-foreground hover:text-primary mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        กลับหน้าบทความ
      </Link>

      {article.featuredImage && (
        <div className="aspect-video relative rounded-lg overflow-hidden mb-8">
          <Image
            src={article.featuredImage}
            alt={title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {article.category && (
        <Badge variant="outline" className="mb-4">
          {article.category}
        </Badge>
      )}

      <h1 className="text-4xl font-bold mb-4">{title}</h1>

      <div className="flex items-center gap-3 mb-8 text-sm text-muted-foreground">
        <Avatar className="h-8 w-8">
          <AvatarImage src={article.author.avatarUrl || ""} />
          <AvatarFallback>
            {article.author.firstName[0]}
            {article.author.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <span>
          {article.author.firstName} {article.author.lastName}
        </span>
        {article.publishedAt && (
          <>
            <span>·</span>
            <span>
              {new Date(article.publishedAt).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </>
        )}
      </div>

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
