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
  Calendar,
  Loader2
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
  const [userSearch, setUserSearch] = useState("")
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
        } else {
          try {
            const err = await usersResponse.json()
            if (usersResponse.status === 403) {
              toastHelpers.error("Forbidden", "Only super admins can add admins")
            } else {
              toastHelpers.error("Error", err.error || "Failed to load users")
            }
          } catch {
            toastHelpers.error("Error", "Failed to load users")
          }
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

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true
    const q = userSearch.toLowerCase()
    return (
      u.email?.toLowerCase().includes(q) ||
      (u.store_name?.toLowerCase()?.includes(q) ?? false)
    )
  })

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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search admins by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg border-2 border-slate-200 focus:border-blue-500 rounded-xl"
            />
          </div>
        </div>
        <Button 
          onClick={() => setCreateDialog(true)}
          className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-xl font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
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
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="user" className="text-lg font-semibold">Select User</Label>
              <div className="mt-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Search users by email or store name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-12 h-12 text-lg border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto border-2 border-slate-200 rounded-xl p-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        newAdmin.userId === user.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setNewAdmin(prev => ({ ...prev, userId: user.id }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          newAdmin.userId === user.id
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-300"
                        }`}>
                          {newAdmin.userId === user.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{user.email}</div>
                          {user.store_name && (
                            <div className="text-sm text-slate-500">{user.store_name}</div>
                          )}
                        </div>
                        {newAdmin.userId === user.id && (
                          <div className="text-blue-500 font-medium text-sm">Selected</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500">
                    {userSearch ? "No users found matching your search" : "No users available to make admin"}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="role" className="text-lg font-semibold">Admin Role</Label>
              <div className="mt-3 space-y-3">
                {[
                  { value: "admin", label: "Admin", description: "Standard admin privileges", icon: Shield, color: "blue" },
                  { value: "super_admin", label: "Super Admin", description: "Full system access", icon: Crown, color: "purple" }
                ].map((role) => {
                  const IconComponent = role.icon;
                  return (
                    <div
                      key={role.value}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        newAdmin.role === role.value
                          ? `border-${role.color}-500 bg-${role.color}-50`
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      onClick={() => setNewAdmin(prev => ({ ...prev, role: role.value as "admin" | "super_admin" }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          newAdmin.role === role.value
                            ? `border-${role.color}-500 bg-${role.color}-500`
                            : "border-slate-300"
                        }`}>
                          {newAdmin.role === role.value && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div className={`w-10 h-10 rounded-lg bg-${role.color}-100 flex items-center justify-center`}>
                          <IconComponent className={`w-5 h-5 text-${role.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{role.label}</div>
                          <div className="text-sm text-slate-500">{role.description}</div>
                        </div>
                        {newAdmin.role === role.value && (
                          <div className={`text-${role.color}-500 font-medium text-sm`}>Selected</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-4">
            <Button 
              variant="outline" 
              onClick={() => setCreateDialog(false)}
              className="h-12 px-6 border-2 border-slate-200 hover:border-slate-300 rounded-xl font-medium"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAdmin} 
              disabled={loading || !newAdmin.userId}
              className="h-12 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Admin
                </>
              )}
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
