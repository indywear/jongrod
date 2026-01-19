import { createSwaggerSpec } from "next-swagger-doc"

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // define api folder
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Jongrod API",
        version: "1.0.0",
        description: "API Documentation for Jongrod Car Rental Platform",
        contact: {
          name: "Jongrod Support",
          email: "support@jongrod.com",
        },
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
  })
  return spec
}
