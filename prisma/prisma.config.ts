import path from "node:path"
import { defineConfig } from "prisma/config"
import dotenv from "dotenv"

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || ""

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),

  datasource: {
    url: databaseUrl,
  },

  migrate: {
    url: databaseUrl,
  },
})
