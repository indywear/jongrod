import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Jongrod API",
        version: "1.0.0",
        description: "Comprehensive API Documentation for Jongrod Car Rental Platform",
        contact: {
          name: "Jongrod Support",
          email: "support@jongrod.com",
        },
      },
      tags: [
        { name: "Banners", description: "Operations related to site banners" },
        { name: "Cars", description: "Operations related to car listings" },
        { name: "Users", description: "User management" },
        { name: "Bookings", description: "Booking management" },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
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
              pricePerDay: { type: "number" },
              images: { type: "array", items: { type: "string" } },
              rentalStatus: { type: "string", enum: ["AVAILABLE", "RENTED", "MAINTENANCE"] },
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
  return spec
}
