import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
    // Try to read pre-generated spec first (works on Vercel)
    const staticPath = path.join(process.cwd(), "public", "swagger.json")
    if (fs.existsSync(staticPath)) {
        const spec = JSON.parse(fs.readFileSync(staticPath, "utf-8"))
        return NextResponse.json(spec)
    }

    // Fallback: generate at runtime (works locally)
    const { getApiDocs } = await import("@/lib/swagger")
    const spec = await getApiDocs()
    return NextResponse.json(spec)
}
