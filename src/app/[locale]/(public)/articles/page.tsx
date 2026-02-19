"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import Image from "next/image"

interface Article {
  id: string
  slug: string
  titleTh: string
  titleEn: string
  excerptTh: string | null
  excerptEn: string | null
  featuredImage: string | null
  category: string | null
  publishedAt: string | null
  author: { firstName: string; lastName: string }
}

export default function ArticlesPage() {
  const t = useTranslations()
  const locale = useLocale()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchArticles()
  }, [page])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/articles?page=${page}&limit=12`)
      const data = await res.json()
      setArticles(data.articles || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  const getTitle = (article: Article) =>
    locale === "en" ? article.titleEn : article.titleTh
  const getExcerpt = (article: Article) =>
    locale === "en" ? article.excerptEn : article.excerptTh

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {t("nav.articles") || "บทความ"}
      </h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">ยังไม่มีบทความ</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/articles/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  {article.featuredImage && (
                    <div className="aspect-video relative">
                      <Image
                        src={article.featuredImage}
                        alt={getTitle(article)}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <CardContent className="pt-4">
                    {article.category && (
                      <Badge variant="outline" className="mb-2">
                        {article.category}
                      </Badge>
                    )}
                    <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                      {getTitle(article)}
                    </h2>
                    {getExcerpt(article) && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {getExcerpt(article)}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-muted-foreground">
                      {article.author.firstName} {article.author.lastName}
                      {article.publishedAt && (
                        <> · {new Date(article.publishedAt).toLocaleDateString("th-TH")}</>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
