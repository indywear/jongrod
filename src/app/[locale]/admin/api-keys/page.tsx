"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Loader2,
  Plus,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  KeyRound,
  Check,
} from "lucide-react"

interface ApiKeyData {
  id: string
  name: string
  prefix: string
  partnerId: string | null
  partner: { id: string; name: string } | null
  permissions: string[]
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface PartnerOption {
  id: string
  name: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([])
  const [partners, setPartners] = useState<PartnerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [partnerId, setPartnerId] = useState<string>("none")
  const [permRead, setPermRead] = useState(true)
  const [permWrite, setPermWrite] = useState(false)
  const [permLogin, setPermLogin] = useState(false)

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/api-keys")
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/partners")
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners || [])
      }
    } catch {
      // Partners list is optional
    }
  }, [])

  useEffect(() => {
    fetchApiKeys()
    fetchPartners()
  }, [fetchApiKeys, fetchPartners])

  const handleCreate = async () => {
    setError(null)
    const permissions: string[] = []
    if (permRead) permissions.push("read")
    if (permWrite) permissions.push("write")
    if (permLogin) permissions.push("login")

    if (!name.trim()) {
      setError("กรุณากรอกชื่อ API Key")
      return
    }
    if (permissions.length === 0) {
      setError("กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          partnerId: partnerId !== "none" ? partnerId : undefined,
          permissions,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewKeyResult(data.plainTextKey)
        setName("")
        setPartnerId("none")
        setPermRead(true)
        setPermWrite(false)
        setPermLogin(false)
        setError(null)
        fetchApiKeys()
      } else {
        const data = await res.json().catch(() => ({ error: "Unknown error" }))
        setError(data.error || `Failed to create API key (${res.status})`)
      }
    } catch (err) {
      console.error("Failed to create API key:", err)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่")
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      })
      if (res.ok) fetchApiKeys()
    } catch (error) {
      console.error("Failed to toggle API key:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบ API Key นี้ใช่ไหม?")) return
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
      })
      if (res.ok) fetchApiKeys()
    } catch (error) {
      console.error("Failed to delete API key:", error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">จัดการ API Keys</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) { setNewKeyResult(null); setError(null) }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              สร้าง API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {newKeyResult ? "สร้าง API Key สำเร็จ" : "สร้าง API Key ใหม่"}
              </DialogTitle>
            </DialogHeader>

            {newKeyResult ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    บันทึก Key นี้ไว้ตอนนี้เลย จะไม่แสดงอีกครั้ง!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border text-sm break-all">
                      {newKeyResult}
                    </code>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(newKeyResult)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => {
                  setDialogOpen(false)
                  setNewKeyResult(null)
                }}>
                  เสร็จสิ้น
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">ชื่อ Key</Label>
                  <Input
                    id="name"
                    placeholder="เช่น Mobile App, Partner ABC"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="partner">ผูกกับ Partner (ไม่บังคับ)</Label>
                  <Select value={partnerId} onValueChange={setPartnerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="ไม่ผูก Partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่ผูก Partner</SelectItem>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>สิทธิ์การใช้งาน</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permRead}
                        onChange={(e) => setPermRead(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Read</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permWrite}
                        onChange={(e) => setPermWrite(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Write</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permLogin}
                        onChange={(e) => setPermLogin(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Login</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                >
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  สร้าง Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            API Keys ({apiKeys.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มี API Key สร้างใหม่เพื่อเริ่มต้นใช้งาน</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>สิทธิ์</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ใช้ล่าสุด</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">
                        {key.prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {key.partner?.name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {key.permissions.map((p) => (
                          <Badge key={p} variant="secondary" className="text-xs">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          key.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {key.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : "ยังไม่เคยใช้"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggle(key.id, key.isActive)}
                          title={key.isActive ? "Disable" : "Enable"}
                        >
                          {key.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(key.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage guide */}
      <Card>
        <CardHeader>
          <CardTitle>วิธีใช้งาน API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium mb-2">1. List Cars</p>
              <code className="text-sm block whitespace-pre-wrap break-all">
                {`GET /api/v1/cars\nX-API-Key: jgr_xxxxx`}
              </code>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium mb-2">2. Login (get JWT)</p>
              <code className="text-sm block whitespace-pre-wrap break-all">
                {`POST /api/v1/auth/login\nX-API-Key: jgr_xxxxx\n{"email":"...", "password":"..."}`}
              </code>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium mb-2">3. My Bookings</p>
              <code className="text-sm block whitespace-pre-wrap break-all">
                {`GET /api/v1/bookings\nX-API-Key: jgr_xxxxx\nAuthorization: Bearer <jwt>`}
              </code>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-medium mb-2">4. Partner Data</p>
              <code className="text-sm block whitespace-pre-wrap break-all">
                {`GET /api/v1/partner/cars\nX-API-Key: jgr_xxxxx (linked to partner)`}
              </code>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Full API docs: <a href="/api-doc" className="text-primary underline">/api-doc</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
