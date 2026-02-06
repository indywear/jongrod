"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PopupData {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
}

const POPUP_DISMISSED_KEY = "popup_dismissed"

export function PromoPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    fetchPopup()
  }, [])

  const fetchPopup = async () => {
    try {
      const response = await fetch("/api/popup")
      const data = await response.json()

      if (data.popup) {
        // Check if user already dismissed this popup today
        const dismissedData = localStorage.getItem(POPUP_DISMISSED_KEY)
        if (dismissedData) {
          const { popupId, dismissedAt } = JSON.parse(dismissedData)
          const dismissedDate = new Date(dismissedAt).toDateString()
          const today = new Date().toDateString()

          // If same popup and dismissed today, don't show
          if (popupId === data.popup.id && dismissedDate === today) {
            return
          }
        }

        setPopup(data.popup)
        // Small delay before showing for smooth animation
        setTimeout(() => setIsVisible(true), 500)
      }
    } catch (error) {
      console.error("Error fetching popup:", error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)

    // Save dismissal in localStorage
    if (popup) {
      localStorage.setItem(POPUP_DISMISSED_KEY, JSON.stringify({
        popupId: popup.id,
        dismissedAt: new Date().toISOString(),
      }))
    }

    // Remove from DOM after animation
    setTimeout(() => setPopup(null), 300)
  }

  const handleClick = () => {
    if (popup?.linkUrl) {
      window.open(popup.linkUrl, "_blank")
    }
    handleDismiss()
  }

  if (!popup) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleDismiss}
      />

      {/* Popup Content */}
      <div
        className={`relative max-w-md w-[90%] bg-white rounded-lg overflow-hidden shadow-2xl transform transition-all duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full"
          onClick={handleDismiss}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image */}
        <div
          className={popup.linkUrl ? "cursor-pointer" : ""}
          onClick={popup.linkUrl ? handleClick : undefined}
        >
          <div className="relative aspect-[4/5] w-full">
            <Image
              src={popup.imageUrl}
              alt={popup.title}
              fill
              className="object-cover"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
