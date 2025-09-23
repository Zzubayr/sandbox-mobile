"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Shield,
  Crown,
  Mail,
  Calendar
} from "lucide-react"
import type { Admin } from "@/lib/types"
import { toastHelpers } from "@/lib/toast-helpers"

interface AdminManagementProps {
  initialAdmins?: Admin[]
}

interface User {
  id: string
  email: string
  store_name?: string
}

export function AdminManagement({ initialAdmins = [] }: AdminManagementProps) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [createDialog, setCreateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Admin | null>(null)
  const [newAdmin, setNewAdmin] = useState({
    userId: "",
    role: "admin" as "admin" | "super_admin"
  })

  // Fetch users and admins for admin creation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, adminsResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/admins')
        ])
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }
        
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json()
          setAdmins(adminsData.admins || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  // Filter admins based on search term
  const filteredAdmins = admins.filter(admin =>
    admin.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateAdmin = async () => {
    if (!newAdmin.userId) {
      toastHelpers.error("Error", "Please select a user")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: newAdmin.userId,
          role: newAdmin.role
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(prev => [data.admin, ...prev])
        setCreateDialog(false)
        setNewAdmin({ userId: "", role: "admin" })
        toastHelpers.success("Admin Created", "New admin has been created successfully")
      } else {
        const error = await response.json()
        toastHelpers.error("Error", error.error || "Failed to create admin")
      }
    } catch (error) {
      console.error('Error creating admin:', error)
      toastHelpers.error("Error", "Failed to create admin")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAdmins(prev => prev.filter(a => a.id !== admin.id))
        setDeleteDialog(null)
        toastHelpers.success("Admin Deleted", "Admin has been deleted successfully")
      } else {
        const error = await response.json()
        toastHelpers.error("Error", error.error || "Failed to delete admin")
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      toastHelpers.error("Error", "Failed to delete admin")
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'super_admin' ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />
  }

  const getRoleColor = (role: string) => {
    return role === 'super_admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage admin users and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">{admins.length} admins</span>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{admin.user?.email || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(admin.role)}>
                      {getRoleIcon(admin.role)}
                      <span className="ml-1 capitalize">{admin.role.replace('_', ' ')}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(admin.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog(admin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Select a user and assign them admin privileges
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">Select User</Label>
              <Select value={newAdmin.userId} onValueChange={(value) => setNewAdmin(prev => ({ ...prev, userId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          {user.store_name && (
                            <span className="text-xs text-gray-500">{user.store_name}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No users available to make admin
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="role">Admin Role</Label>
              <Select value={newAdmin.role} onValueChange={(value: "admin" | "super_admin") => setNewAdmin(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Super Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAdmin} disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Admin</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this admin? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteDialog && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{deleteDialog.user?.email}</h4>
                <p className="text-sm text-gray-500 capitalize">
                  {deleteDialog.role.replace('_', ' ')} Admin
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteDialog && handleDeleteAdmin(deleteDialog)}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
