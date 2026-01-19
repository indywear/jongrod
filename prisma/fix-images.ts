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

  console.log("🔄 Renaming images and updating database...")

  const imagesDir = path.join(__dirname, "../public/uploads/cars")
  const imageFiles = fs.readdirSync(imagesDir)
  console.log(`📁 Found ${imageFiles.length} image files`)

  const renamedMap = new Map<string, string>()
  
  for (const file of imageFiles) {
    const ext = path.extname(file)
    const numericMatch = file.match(/(\d{3,5})/)
    
    if (numericMatch) {
      const numericId = numericMatch[1]
      const newFileName = `car-${numericId}${ext}`
      const oldPath = path.join(imagesDir, file)
      const newPath = path.join(imagesDir, newFileName)
      
      if (!fs.existsSync(newPath) && fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath)
        console.log(`Renamed: ${file} -> ${newFileName}`)
      }
      
      renamedMap.set(numericId, newFileName)
    }
  }
  console.log(`✅ Renamed ${renamedMap.size} files`)

  const cars = await prisma.car.findMany({
    select: { id: true, licensePlate: true }
  })
  console.log(`🚗 Found ${cars.length} cars in database`)

  let updated = 0
  for (const car of cars) {
    const numericPart = car.licensePlate.match(/(\d{3,5})/)?.[1]
    
    if (numericPart && renamedMap.has(numericPart)) {
      const fileName = renamedMap.get(numericPart)!
      await prisma.car.update({
        where: { id: car.id },
        data: { images: [`/uploads/cars/${fileName}`] }
      })
      updated++
    } else {
      await prisma.car.update({
        where: { id: car.id },
        data: { images: [] }
      })
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
