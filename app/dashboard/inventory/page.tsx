"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toastHelpers } from "@/lib/toast-helpers"
import type { Product } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MoreHorizontal, ArrowLeft } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({ open: false, productId: null, productTitle: "" })
  const [adjustTarget, setAdjustTarget] = useState<{ stock: number; reserved: number }>({ stock: 0, reserved: 0 })
  const [adjustValue, setAdjustValue] = useState("0")
  const [movementDialog, setMovementDialog] = useState<{ open: boolean; productId: string | null; productTitle: string }>({ open: false, productId: null, productTitle: "" })
  const [movementLoading, setMovementLoading] = useState(false)
  const [movements, setMovements] = useState<Array<{ id: string; type: string; quantity: number; created_at?: string; note?: string }>>([])
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [showArchived])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/products?includeArchived=${showArchived}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setProducts(data.products || [])
    } catch (err) {
      console.error("Inventory fetch error:", err)
      toastHelpers.saveError("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.sku?.toLowerCase().includes(query.toLowerCase()) ||
        (p.category?.name || "").toLowerCase().includes(query.toLowerCase())
      const matchesStatus = statusFilter === "all" || p.status === statusFilter
      const matchesArchive = showArchived ? true : !p.is_archived
      return matchesQuery && matchesStatus && matchesArchive
    })
  }, [products, query, statusFilter, showArchived])

  const openAdjust = (id: string, title: string) => {
    setAdjustValue("0")
    const prod = products.find((p) => p.id === id)
    setAdjustTarget({
      stock: prod?.stock || 0,
      reserved: (prod as any)?.reserved_stock || 0,
    })
    setAdjustDialog({ open: true, productId: id, productTitle: title })
  }

  const submitAdjust = async () => {
    if (!adjustDialog.productId) return
    const delta = Number(adjustValue)
    if (!Number.isFinite(delta) || delta === 0) {
      toastHelpers.saveError("Enter a non-zero number")
      return
    }
    try {
      const resp = await fetch(`/api/dashboard/products/${adjustDialog.productId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      setProducts(products.map(p => p.id === adjustDialog.productId ? { ...p, stock: data.stock } : p))
      toastHelpers.success(`Stock updated for "${adjustDialog.productTitle}"`)
      setAdjustDialog({ open: false, productId: null, productTitle: "" })
      setAdjustTarget({ stock: 0, reserved: 0 })
    } catch (err) {
      console.error("Adjust error:", err)
      toastHelpers.saveError("Failed to adjust stock")
    }
  }

  const openMovements = async (id: string, title: string) => {
    setMovementDialog({ open: true, productId: id, productTitle: title })
    setMovementLoading(true)
    try {
      const resp = await fetch(`/api/dashboard/products/${id}/movements`, { cache: 'no-store' })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      setMovements((data.movements || []).map((m: any) => ({
        id: m.id || m._id || Math.random().toString(36).slice(2),
        type: m.type,
        quantity: m.quantity,
        created_at: m.created_at,
        note: m.note,
      })))
    } catch (err) {
      console.error("Movements error:", err)
      toastHelpers.saveError("Failed to load history")
    } finally {
      setMovementLoading(false)
    }
  }

  const toggleArchive = async (product: Product) => {
    try {
      if (product.is_archived) {
        const resp = await fetch(`/api/dashboard/products/${product.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_archived: false, status: 'draft' })
        })
        if (!resp.ok) throw new Error('Restore failed')
        setProducts(products.map(p => p.id === product.id ? { ...p, is_archived: false, status: 'draft' as any } : p))
        toastHelpers.success(`Restored "${product.title}"`)
      } else {
        const resp = await fetch(`/api/dashboard/products/${product.id}`, { method: 'DELETE' })
        if (!resp.ok) throw new Error('Archive failed')
        setProducts(products.map(p => p.id === product.id ? { ...p, is_archived: true, status: 'inactive' as any } : p))
        toastHelpers.success(`Archived "${product.title}"`)
      }
    } catch (err) {
      console.error("Archive toggle error:", err)
      toastHelpers.saveError("Failed to update archive state")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-600">Manage stock, holds, and variants</p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search by title or SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={showArchived ? "true" : "false"} onValueChange={(v) => setShowArchived(v === "true")}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Archived" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Hide archived</SelectItem>
              <SelectItem value="true">Show archived</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>Real-time stock with holds and variants</CardDescription>
          </div>
          <div className="text-sm text-slate-600">
            {filtered.length} of {products.length} items
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No products match your filters.</p>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {filtered.map((p) => {
                  const reserved = (p as any).reserved_stock || 0
                  const available = Math.max(0, p.stock - reserved)
                  const statusClass =
                    p.status === "active"
                      ? "bg-[#2B6DA9] text-white"
                      : p.status === "draft"
                        ? "bg-[#E8F1F9] text-[#1F3E5C]"
                        : "bg-slate-200 text-slate-800"
                  return (
                    <div key={p.id} className="rounded-lg border p-4 space-y-3 bg-gradient-to-br from-white to-slate-50">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{p.title}</p>
                          {p.category?.name && <p className="text-xs text-slate-500">{p.category.name}</p>}
                          <p className="text-xs text-slate-500 mt-1">SKU: {p.sku || "—"}</p>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Badge className={statusClass}>{p.status}</Badge>
                          {p.is_archived && <Badge variant="outline" className="border-[#93BAD9] text-[#2B6DA9] bg-[#E8F1F9]">Archived</Badge>}
                          {p.allow_backorder && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Backorder</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">Available</p>
                          <p className="text-lg font-bold text-slate-900">{available}</p>
                          <p className="text-xs text-slate-500">Total: {p.stock} • Reserved: {reserved}</p>
                        </div>
                        <div className="text-sm text-slate-700">
                          {Array.isArray((p as any).variants) && (p as any).variants.length > 0
                            ? `${(p as any).variants.length} variant${(p as any).variants.length > 1 ? 's' : ''}`
                            : "No variants"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => openAdjust(p.id, p.title)}>Adjust</Button>
                        <Button className="flex-1" variant="outline" onClick={() => openMovements(p.id, p.title)}>History</Button>
                        <Button className="flex-1" variant="outline" asChild>
                          <Link href={`/dashboard/products/${p.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                      <Button variant="ghost" className="text-sm text-red-600 px-0" onClick={() => toggleArchive(p)}>
                        {p.is_archived ? "Restore" : "Archive"}
                      </Button>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const reserved = (p as any).reserved_stock || 0
                    const available = Math.max(0, p.stock - reserved)
                    const statusClass =
                      p.status === "active"
                        ? "bg-[#2B6DA9] text-white"
                        : p.status === "draft"
                          ? "bg-[#E8F1F9] text-[#1F3E5C]"
                          : "bg-slate-200 text-slate-800"
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="max-w-[220px]">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 truncate">{p.title}</span>
                            {p.category?.name && <span className="text-xs text-slate-500">{p.category.name}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{p.sku || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={statusClass}>{p.status}</Badge>
                            {p.is_archived && <Badge variant="outline" className="border-[#93BAD9] text-[#2B6DA9] bg-[#E8F1F9]">Archived</Badge>}
                            {p.allow_backorder && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Backorder</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-semibold text-slate-900">{available}</div>
                          <div className="text-xs text-slate-500">Total: {p.stock}</div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{reserved}</TableCell>
                        <TableCell className="text-sm text-slate-700">
                          {Array.isArray((p as any).variants) && (p as any).variants.length > 0
                            ? `${(p as any).variants.length} variant${(p as any).variants.length > 1 ? 's' : ''}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Inventory</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openAdjust(p.id, p.title)}>Adjust stock</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMovements(p.id, p.title)}>View history</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Product</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/products/${p.id}/edit`}>Edit product</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleArchive(p)}>
                                {p.is_archived ? "Restore" : "Archive"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription className="space-y-1">
              <div className="font-medium text-slate-800">{adjustDialog.productTitle}</div>
              <div className="text-xs text-slate-500">Enter a positive number to add, negative to remove.</div>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-3 bg-slate-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Current available</span>
              <span className="font-semibold text-slate-900">
                {Math.max(0, adjustTarget.stock - adjustTarget.reserved)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Reserved</span>
              <span className="font-semibold text-slate-900">{adjustTarget.reserved}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total stock</span>
              <span className="font-semibold text-slate-900">{adjustTarget.stock}</span>
            </div>
          </div>
          <div className="space-y-2">
            <LabelInput
              value={adjustValue}
              onChange={setAdjustValue}
              onPreset={(delta) => setAdjustValue(String(Number(adjustValue || 0) + delta))}
              stock={adjustTarget.stock}
              reserved={adjustTarget.reserved}
            />
          </div>
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, productId: null, productTitle: "" })}>Cancel</Button>
            <Button onClick={submitAdjust}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={movementDialog.open} onOpenChange={(open) => setMovementDialog({ ...movementDialog, open })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock History</DialogTitle>
            <DialogDescription>{movementDialog.productTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {movementLoading ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : movements.length === 0 ? (
              <p className="text-sm text-slate-500">No movements recorded yet.</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="flex items-start justify-between rounded-md border p-2">
                  <div>
                    <p className="font-medium text-slate-800 capitalize">{m.type}</p>
                    {m.note && <p className="text-xs text-slate-500 mt-1">{m.note}</p>}
                    {m.created_at && (
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${m.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </span>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialog({ open: false, productId: null, productTitle: "" })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LabelInput({
  value,
  onChange,
  onPreset,
  stock,
  reserved,
}: {
  value: string
  onChange: (v: string) => void
  onPreset: (delta: number) => void
  stock: number
  reserved: number
}) {
  const delta = Number(value)
  const parsed = Number.isFinite(delta) ? delta : 0
  const nextStock = Math.max(0, stock + parsed)
  const nextAvailable = Math.max(0, nextStock - reserved)
  const isAdding = parsed > 0
  const isRemoving = parsed < 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-slate-600">Adjustment</Label>
        <div
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            isAdding ? "bg-emerald-50 text-emerald-700" :
            isRemoving ? "bg-rose-50 text-rose-700" :
            "bg-slate-100 text-slate-700"
          )}
        >
          {isAdding ? "Adding" : isRemoving ? "Removing" : "No change"}
        </div>
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 5 to add, -3 to remove"
        className="h-11"
      />
      <div className="flex flex-wrap gap-2">
        {[+1, +5, +10, -1, -5, -10].map((n) => (
          <Button key={n} variant="outline" size="sm" type="button" onClick={() => onPreset(n)}>
            {n > 0 ? `+${n}` : n}
          </Button>
        ))}
        <Button variant="ghost" size="sm" type="button" onClick={() => onChange("0")}>
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border p-2 bg-slate-50">
          <p className="text-slate-500">New total</p>
          <p className="text-lg font-semibold text-slate-900">{nextStock}</p>
        </div>
        <div className="rounded-md border p-2 bg-slate-50">
          <p className="text-slate-500">New available</p>
          <p className="text-lg font-semibold text-slate-900">{nextAvailable}</p>
        </div>
      </div>
    </div>
  )
}
