
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function SSOPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const token = searchParams.get("token")

        if (!token) {
            setError("Token not found")
            return
        }

        const verifyToken = async () => {
            try {
                const res = await fetch("/api/auth/verify-sso", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ token }),
                })

                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Verification failed")
                }

                // Session cookie is set by the API — redirect to home
                window.location.href = "/"
            } catch (err) {
                console.error("SSO Error:", err)
                setError(err instanceof Error ? err.message : "Authentication failed")
            }
        }

        verifyToken()
    }, [searchParams, router])

    if (error) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center p-4">
                <div className="text-red-500 text-lg font-semibold mb-2">Login Failed</div>
                <div className="text-muted-foreground">{error}</div>
                <button
                    onClick={() => router.push("/login")}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                    Back to Login
                </button>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Authenticating...</p>
            </div>
        </div>
    )
}
