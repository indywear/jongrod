import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import * as fs from "fs"
import * as path from "path"

const connectionString = process.env.DATABASE_URL || ""

async function main() {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("🌱 Starting seed...")

  const dataPath = path.join(__dirname, "seed-data.json")
  const rawData = fs.readFileSync(dataPath, "utf-8")
  const data = JSON.parse(rawData)

  const hashedPassword = await bcrypt.hash(data.admin.password, 12)
  const user = await prisma.user.upsert({
    where: { email: data.admin.email },
    update: {},
    create: {
      email: data.admin.email,
      phone: data.admin.phone,
      password: hashedPassword,
      firstName: data.admin.firstName,
      lastName: data.admin.lastName,
      role: "PARTNER_ADMIN",
    },
  })
  console.log(`✅ Created Partner Admin: ${user.email}`)

  const partner = await prisma.partner.upsert({
    where: { id: "av-carrent-official" },
    update: {},
    create: {
      id: "av-carrent-official",
      name: data.partner.name,
      phone: data.partner.phone,
      contactEmail: data.partner.contactEmail,
      commissionRate: data.partner.commissionRate,
      minAdvanceHours: data.partner.minAdvanceHours,
      status: "ACTIVE",
    },
  })
  console.log(`✅ Created Partner: ${partner.name}`)

  await prisma.partnerAdmin.upsert({
    where: {
      partnerId_userId: {
        partnerId: partner.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      partnerId: partner.id,
      userId: user.id,
      role: "OWNER",
      canClaimLeads: true,
    },
  })
  console.log(`✅ Linked user to partner`)

  let carCount = 0
  const validCategories = ["SEDAN", "SUV", "VAN", "PICKUP", "LUXURY", "COMPACT", "MOTORCYCLE"]
  
  for (const car of data.cars) {
    const category = validCategories.includes(car.category) ? car.category : "SEDAN"
    
    try {
      await prisma.car.upsert({
        where: { licensePlate: car.licensePlate },
        update: {},
        create: {
          partnerId: partner.id,
          licensePlate: car.licensePlate,
          brand: car.brand,
          model: car.model,
          year: car.year || 2020,
          category: category,
          transmission: car.transmission || "AUTO",
          fuelType: car.fuelType || "PETROL",
          seats: car.seats || 5,
          doors: car.doors || 4,
          pricePerDay: car.pricePerDay || 1000,
          features: [],
          images: car.image ? [car.imagePath || car.image] : [],
          approvalStatus: "APPROVED",
          rentalStatus: "AVAILABLE",
        },
      })
      carCount++
    } catch (e) {
      console.log(`⚠️ Skipped car ${car.licensePlate}: ${e}`)
    }
  }
  console.log(`✅ Created ${carCount} cars`)

  const platformOwnerPassword = await bcrypt.hash("Admin@Jongrod2024", 12)
  const platformOwner = await prisma.user.upsert({
    where: { email: "admin@jongrod.com" },
    update: {},
    create: {
      email: "admin@jongrod.com",
      phone: "0900000000",
      password: platformOwnerPassword,
      firstName: "Admin",
      lastName: "Jongrod",
      role: "PLATFORM_OWNER",
    },
  })
  console.log(`✅ Created Platform Owner: ${platformOwner.email}`)

  console.log("🎉 Seed completed!")
  
  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
