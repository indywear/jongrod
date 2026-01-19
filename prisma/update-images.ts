import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import * as fs from "fs"
import * as path from "path"

const connectionString = process.env.DATABASE_URL || ""

async function main() {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("🔄 Updating car images...")

  const imagesDir = path.join(__dirname, "../public/uploads/cars")
  const imageFiles = fs.readdirSync(imagesDir)
  console.log(`📁 Found ${imageFiles.length} image files`)

  const imageMap = new Map<string, string>()
  for (const file of imageFiles) {
    const baseName = path.parse(file).name.replace(/\s+/g, "")
    imageMap.set(baseName.toLowerCase(), file)
    
    const numericPart = file.match(/(\d{3,5})/)?.[1]
    if (numericPart) {
      imageMap.set(numericPart, file)
    }
  }

  const cars = await prisma.car.findMany({
    select: { id: true, licensePlate: true, images: true }
  })
  console.log(`🚗 Found ${cars.length} cars in database`)

  let updated = 0
  for (const car of cars) {
    const plateClean = car.licensePlate.replace(/\s+/g, "").toLowerCase()
    
    let matchedFile: string | undefined
    
    for (const [key, file] of imageMap) {
      if (plateClean.includes(key) || key.includes(plateClean)) {
        matchedFile = file
        break
      }
    }
    
    if (!matchedFile) {
      const numericPart = car.licensePlate.match(/(\d{3,5})/)?.[1]
      if (numericPart && imageMap.has(numericPart)) {
        matchedFile = imageMap.get(numericPart)
      }
    }

    if (matchedFile) {
      const newImagePath = `/uploads/cars/${matchedFile}`
      await prisma.car.update({
        where: { id: car.id },
        data: { images: [newImagePath] }
      })
      updated++
    }
  }

  console.log(`✅ Updated ${updated} cars with images`)
  console.log("🎉 Done!")

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
