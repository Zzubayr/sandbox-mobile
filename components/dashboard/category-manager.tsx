"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { toastHelpers } from "@/lib/toast-helpers"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import type { Category } from "@/lib/types"

interface CategoryManagerProps {
  vendorId: string
  onCategoriesChange?: (categories: Category[]) => void
}

export function CategoryManager({ vendorId, onCategoriesChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })

  useEffect(() => {
    loadCategories()
  }, [vendorId])

  const loadCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("name")

      if (error) throw error
      
      setCategories(data || [])
      onCategoriesChange?.(data || [])
    } catch (error) {
      console.error("Error loading categories:", error)
      toastHelpers.error("Failed to load categories", "Please try again")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsAdding(true)
    try {
      const supabase = createClient()
      
      // Generate slug from category name
      const slug = newCategoryName.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const { data, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
          slug: slug,
          vendor_id: vendorId,
        })
        .select()
        .single()

      if (error) throw error

      setCategories([...categories, data])
      onCategoriesChange?.([...categories, data])
      setNewCategoryName("")
      toastHelpers.success("Category Added", `${data.name} has been created`)
    } catch (error) {
      console.error("Error adding category:", error)
      toastHelpers.error("Failed to add category", "Please try again")
    } finally {
      setIsAdding(false)
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory || !editName.trim()) return

    setIsEditing(true)
    try {
      const supabase = createClient()
      
      // Generate new slug from updated name
      const slug = editName.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const { data, error } = await supabase
        .from("categories")
        .update({ 
          name: editName.trim(),
          slug: slug
        })
        .eq("id", editingCategory.id)
        .select()
        .single()

      if (error) throw error

      setCategories(categories.map(cat => cat.id === editingCategory.id ? data : cat))
      onCategoriesChange?.(categories.map(cat => cat.id === editingCategory.id ? data : cat))
      setEditingCategory(null)
      setEditName("")
      toastHelpers.success("Category Updated", `${data.name} has been updated`)
    } catch (error) {
      console.error("Error updating category:", error)
      toastHelpers.error("Failed to update category", "Please try again")
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteDialog.category) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteDialog.category.id)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== deleteDialog.category!.id))
      onCategoriesChange?.(categories.filter(cat => cat.id !== deleteDialog.category!.id))
      setDeleteDialog({ open: false, category: null })
      toastHelpers.success("Category Deleted", `${deleteDialog.category.name} has been deleted`)
    } catch (error) {
      console.error("Error deleting category:", error)
      toastHelpers.error("Failed to delete category", "Please try again")
    }
  }

  const startEdit = (category: Category) => {
    setEditingCategory(category)
    setEditName(category.name)
  }

  const cancelEdit = () => {
    setEditingCategory(null)
    setEditName("")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Categories
          </CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Categories
          </CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Category */}
          <div className="flex gap-2">
            <Input
              placeholder="Category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddCategory} 
              disabled={!newCategoryName.trim() || isAdding}
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No categories yet. Add your first category above.
              </p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingCategory?.id === category.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEditCategory()}
                        className="flex-1"
                        size="sm"
                      />
                      <Button size="sm" onClick={handleEditCategory} disabled={isEditing}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.name}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteDialog({ open: true, category })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, category: null })}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteDialog.category?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  )
}
