// This script generates the Swagger/OpenAPI spec at build time
// so it works on Vercel where source .ts files aren't available at runtime
const { createSwaggerSpec } = require("next-swagger-doc")
const fs = require("fs")
const path = require("path")

const spec = createSwaggerSpec({
  apiFolder: "src/app/api",
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Jongrod API",
      version: "2.0.0",
      description:
        "Comprehensive API Documentation for Jongrod Car Rental Platform.\n\n" +
        "## Authentication\n" +
        "- **Cookie Session**: Used by the website (login via `/api/auth/login`)\n" +
        "- **API Key**: External API access via `X-API-Key` header\n" +
        "- **Bearer JWT**: External user auth via `Authorization: Bearer <token>`\n\n" +
        "## External API (v1)\n" +
        "All `/api/v1/*` endpoints require an `X-API-Key` header.\n" +
        "Endpoints that access user data also require a Bearer JWT token.",
      contact: {
        name: "Jongrod Support",
        email: "support@jongrod.com",
      },
    },
    tags: [
      { name: "Auth", description: "User authentication (login, register, logout)" },
      { name: "Cars", description: "Public car listings" },
      { name: "Bookings", description: "Booking management" },
      { name: "Documents", description: "Document upload and management" },
      { name: "Customer", description: "Customer profile and data" },
      { name: "Partner", description: "Partner dashboard endpoints" },
      { name: "Admin", description: "Platform admin endpoints" },
      { name: "Admin Banners", description: "CMS banner management" },
      { name: "API Keys", description: "API key management (admin)" },
      { name: "External Auth", description: "External API authentication (v1)" },
      { name: "External Cars", description: "External car listing API (v1)" },
      { name: "External Bookings", description: "External booking API (v1)" },
      { name: "External Partner", description: "External partner data API (v1)" },
      { name: "Content", description: "Pages, articles, popups" },
      { name: "Banners", description: "Public banner endpoints" },
    ],
    components: {
      securitySchemes: {
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "jongrod_session",
          description: "Session cookie set by /api/auth/login",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key for external access. Get one from Admin > API Keys.",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from /api/v1/auth/login",
        },
      },
      schemas: {
        Banner: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            imageUrl: { type: "string" },
            linkUrl: { type: "string", nullable: true },
            position: { type: "string", enum: ["HOMEPAGE_HERO", "HOMEPAGE_MIDDLE", "LISTING_TOP", "POPUP"] },
            sortOrder: { type: "integer" },
            isActive: { type: "boolean" },
          },
        },
        Car: {
          type: "object",
          properties: {
            id: { type: "string" },
            brand: { type: "string" },
            model: { type: "string" },
            year: { type: "integer" },
            licensePlate: { type: "string" },
            category: { type: "string", enum: ["SEDAN", "SUV", "VAN", "PICKUP", "LUXURY", "COMPACT", "MOTORCYCLE"] },
            transmission: { type: "string", enum: ["AUTO", "MANUAL"] },
            fuelType: { type: "string", enum: ["PETROL", "DIESEL", "HYBRID", "EV"] },
            seats: { type: "integer" },
            doors: { type: "integer" },
            pricePerDay: { type: "number" },
            images: { type: "array", items: { type: "string" } },
            rentalStatus: { type: "string", enum: ["AVAILABLE", "RENTED", "MAINTENANCE"] },
            approvalStatus: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
            partner: { $ref: "#/components/schemas/Partner" },
          },
        },
        Partner: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            contactEmail: { type: "string" },
            phone: { type: "string" },
            logoUrl: { type: "string", nullable: true },
            commissionRate: { type: "number" },
            status: { type: "string", enum: ["ACTIVE", "SUSPENDED"] },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string" },
            bookingNumber: { type: "string" },
            customerName: { type: "string" },
            customerEmail: { type: "string" },
            customerPhone: { type: "string" },
            customerNote: { type: "string", nullable: true },
            pickupDatetime: { type: "string", format: "date-time" },
            returnDatetime: { type: "string", format: "date-time" },
            pickupLocation: { type: "string" },
            returnLocation: { type: "string" },
            totalPrice: { type: "number" },
            leadStatus: { type: "string", enum: ["NEW", "CLAIMED", "PICKUP", "ACTIVE", "RETURN", "COMPLETED", "CANCELLED"] },
            car: { $ref: "#/components/schemas/Car" },
            partner: { $ref: "#/components/schemas/Partner" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            firstName: { type: "string" },
            lastName: { type: "string" },
            role: { type: "string", enum: ["CUSTOMER", "PARTNER_ADMIN", "PLATFORM_OWNER"] },
            avatarUrl: { type: "string", nullable: true },
          },
        },
        UserRegister: {
          type: "object",
          required: ["email", "password", "firstName", "lastName", "phone"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            firstName: { type: "string" },
            lastName: { type: "string" },
            phone: { type: "string" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["password"],
          properties: {
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            password: { type: "string" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            expiresIn: { type: "integer" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        Document: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            type: { type: "string", enum: ["ID_CARD", "DRIVER_LICENSE"] },
            documentNumber: { type: "string" },
            frontImageUrl: { type: "string" },
            status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
          },
        },
        ApiKey: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            prefix: { type: "string" },
            partnerId: { type: "string", nullable: true },
            permissions: { type: "array", items: { type: "string", enum: ["read", "write", "login"] } },
            isActive: { type: "boolean" },
            lastUsedAt: { type: "string", format: "date-time", nullable: true },
            expiresAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
    security: [],
  },
})

const outputPath = path.join(__dirname, "..", "public", "swagger.json")
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2))
console.log(`Swagger spec generated: ${Object.keys(spec.paths || {}).length} paths -> public/swagger.json`)
