export type UserRole = "CUSTOMER" | "PARTNER_ADMIN" | "PLATFORM_OWNER"

export type CarCategory = "SEDAN" | "SUV" | "VAN" | "PICKUP" | "LUXURY" | "COMPACT" | "MOTORCYCLE"

export type Transmission = "AUTO" | "MANUAL"

export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "EV"

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED"

export type RentalStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE"

export type LeadStatus = "NEW" | "CLAIMED" | "PICKUP" | "ACTIVE" | "RETURN" | "COMPLETED" | "CANCELLED"

export type DocumentType = "ID_CARD" | "DRIVER_LICENSE"

export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED"

export type PartnerStatus = "ACTIVE" | "SUSPENDED"

export type PartnerRole = "OWNER" | "ADMIN" | "STAFF"

export type CommissionStatus = "PENDING" | "PAID"

export type BannerPosition = "HOMEPAGE_HERO" | "HOMEPAGE_MIDDLE" | "LISTING_TOP" | "POPUP"

export type Language = "th" | "en"

export interface SearchParams {
  pickupDate?: string
  returnDate?: string
  category?: CarCategory
  transmission?: Transmission
  fuelType?: FuelType
  minPrice?: number
  maxPrice?: number
  brand?: string
  sort?: "price_asc" | "price_desc" | "newest"
  page?: number
  limit?: number
}
