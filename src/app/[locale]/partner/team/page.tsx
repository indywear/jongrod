"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  DialogFooter,
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
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2, User, Loader2, Users } from "lucide-react"

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  phone: string
  role: string
  canClaimLeads: boolean
  joinedAt: string
}

interface UserData {
  partnerId?: string
}

export default function TeamPage() {
  const t = useTranslations()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("STAFF")
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [partnerId, setPartnerId] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData: UserData = JSON.parse(storedUser)
        if (userData.partnerId) {
          setPartnerId(userData.partnerId)
        } else {
          setPartnerId("av-carrent-official")
        }
      } catch {
        setPartnerId("av-carrent-official")
      }
    } else {
      setPartnerId("av-carrent-official")
    }
  }, [])

  useEffect(() => {
    if (partnerId) {
      fetchTeam()
    }
  }, [partnerId])

  const fetchTeam = async () => {
    if (!partnerId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/partner/team?partnerId=${partnerId}`)
      const data = await response.json()
      setTeam(data.team || [])
    } catch (error) {
      console.error("Error fetching team:", error)
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Badge className="bg-purple-100 text-purple-800">Owner</Badge>
      case "ADMIN":
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
      case "STAFF":
        return <Badge variant="outline">Staff</Badge>
      default:
        return null
    }
  }

  const handleInvite = async () => {
    if (!partnerId || !inviteEmail) return

    setSaving(true)
    try {
      const response = await fetch("/api/partner/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId,
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setIsDialogOpen(false)
        setInviteEmail("")
        setInviteRole("STAFF")
        fetchTeam()
      } else {
        alert(data.error || "ไม่สามารถเพิ่มสมาชิกได้")
      }
    } catch (error) {
      console.error("Error inviting team member:", error)
      alert("เกิดข้อผิดพลาด")
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCanClaimLeads = async (member: TeamMember) => {
    try {
      await fetch("/api/partner/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          canClaimLeads: !member.canClaimLeads,
        }),
      })
      fetchTeam()
    } catch (error) {
      console.error("Error updating team member:", error)
    }
  }

  const handleRemoveMember = async (id: string) => {
    if (!confirm("ต้องการลบสมาชิกนี้ออกจากทีม?")) return

    try {
      const response = await fetch(`/api/partner/team?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchTeam()
      }
    } catch (error) {
      console.error("Error removing team member:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("partner.team")}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              เชิญสมาชิก
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เชิญสมาชิกใหม่</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>อีเมล</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ผู้ใช้ต้องลงทะเบียนในระบบก่อนจึงจะเพิ่มเข้าทีมได้
                </p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleInvite} disabled={saving || !inviteEmail}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                เพิ่มสมาชิก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {team.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4" />
              <p>ยังไม่มีสมาชิกในทีม</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สมาชิก</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>รับ Leads ได้</TableHead>
                  <TableHead>เข้าร่วมเมื่อ</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={member.canClaimLeads}
                        disabled={member.role === "OWNER"}
                        onCheckedChange={() => handleToggleCanClaimLeads(member)}
                      />
                    </TableCell>
                    <TableCell>{member.joinedAt}</TableCell>
                    <TableCell>
                      {member.role !== "OWNER" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
