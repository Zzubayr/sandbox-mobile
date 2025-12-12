"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getContrastingTextColor } from "@/lib/color-utils"
import { AttributeEditor } from "@/components/dashboard/attribute-editor"
import { X } from "lucide-react"

interface ProductVariationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attributes: Record<string, any>
  onSave: (attributes: Record<string, any>) => void
}

export function ProductVariationsDrawer({
  open,
  onOpenChange,
  attributes,
  onSave,
}: ProductVariationsDrawerProps) {
  // Local state for editing
  const [localAttributes, setLocalAttributes] = useState(attributes)
  const [colorInput, setColorInput] = useState("")
  const [customSizeInput, setCustomSizeInput] = useState("")
  const [weightValue, setWeightValue] = useState("")
  const [weightUnit, setWeightUnit] = useState("kg")

  // Sync with parent when opened
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalAttributes(attributes)
      // Parse existing weight if present
      if (typeof attributes.weight === 'string' && attributes.weight) {
        const match = attributes.weight.match(/^([\d.]+)\s*(\w+)$/)
        if (match) {
          setWeightValue(match[1])
          setWeightUnit(match[2])
        }
      }
    }
    onOpenChange(isOpen)
  }

  const addColor = () => {
    const val = colorInput.trim()
    if (!val) return
    const current: string[] = Array.isArray(localAttributes.colors) ? localAttributes.colors : []
    if (current.includes(val)) return
    setLocalAttributes((prev) => ({
      ...prev,
      colors: [...current, val],
    }))
    setColorInput("")
  }

  const removeColor = (name: string) => {
    const current: string[] = Array.isArray(localAttributes.colors) ? localAttributes.colors : []
    setLocalAttributes((prev) => ({
      ...prev,
      colors: current.filter((c) => c !== name),
    }))
  }

  const toggleSize = (size: string) => {
    const current: string[] = Array.isArray(localAttributes.sizes) ? localAttributes.sizes : []
    const set = new Set(current)
    if (set.has(size)) set.delete(size)
    else set.add(size)
    setLocalAttributes((prev) => ({
      ...prev,
      sizes: Array.from(set),
    }))
  }

  const addCustomSizes = () => {
    const vals = customSizeInput.split(',').map(v => v.trim()).filter(Boolean)
    vals.forEach(v => toggleSize(v))
    setCustomSizeInput("")
  }

  const updateWeight = () => {
    const val = weightValue.trim()
    const final = val ? `${val} ${weightUnit}` : ""
    setLocalAttributes((prev) => ({
      ...prev,
      weight: final,
    }))
  }

  const handleSave = () => {
    // Update weight before saving
    const val = weightValue.trim()
    const final = val ? `${val} ${weightUnit}` : ""
    const finalAttributes = {
      ...localAttributes,
      weight: final,
    }
    onSave(finalAttributes)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalAttributes(attributes)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-xl">Product Variations</SheetTitle>
          <SheetDescription className="text-base">
            Add colors, sizes, and other attributes for your product
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Colors Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Color Options</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add color variations for your product
              </p>
            </div>
            
            <div className="min-h-[60px] p-4 border-2 border-dashed rounded-lg bg-slate-50/50">
              {(Array.isArray(localAttributes.colors) && localAttributes.colors.length > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {localAttributes.colors.map((c: string) => (
                    <Badge
                      key={c}
                      className="gap-2 px-3 py-1.5 text-sm"
                      style={{
                        backgroundColor: c,
                        color: getContrastingTextColor(c),
                        borderColor: "transparent"
                      }}
                    >
                      {c}
                      <button
                        type="button"
                        className="opacity-80 hover:opacity-100 transition-opacity"
                        onClick={() => removeColor(c)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm text-muted-foreground">No colors added yet</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Red, Blue, #FF5733"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addColor()
                  }
                }}
                className="flex-1 h-11"
              />
              <Button 
                type="button" 
                onClick={addColor} 
                size="lg"
                className="px-6"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Sizes Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Size Options</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Select standard sizes or add custom ones
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => {
                  const active = Array.isArray(localAttributes.sizes) && localAttributes.sizes.includes(s)
                  return (
                    <Button
                      key={s}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => toggleSize(s)}
                      className="min-w-[70px] font-medium"
                    >
                      {s}
                    </Button>
                  )
                })}
              </div>
              
              {/* Custom sizes display */}
              {Array.isArray(localAttributes.sizes) && localAttributes.sizes.some(s => !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(s)) && (
                <div className="p-3 border rounded-lg bg-slate-50/50">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-medium text-muted-foreground self-center mr-1">Custom:</span>
                    {localAttributes.sizes.filter(s => !['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(s)).map((s: string) => (
                      <Badge key={s} variant="secondary" className="gap-1.5 px-3 py-1">
                        {s}
                        <button
                          type="button"
                          className="opacity-80 hover:opacity-100 transition-opacity"
                          onClick={() => toggleSize(s)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Custom sizes (comma separated)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomSizes()
                    }
                  }}
                  className="flex-1 h-11"
                />
                <Button 
                  type="button" 
                  onClick={addCustomSizes}
                  size="lg"
                  className="px-6"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Weight Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Weight</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Specify the product weight
              </p>
            </div>
            
            <div className="flex gap-3">
              <Input
                placeholder="e.g., 1.2"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                onBlur={updateWeight}
                className="flex-1 h-11"
                type="number"
                step="0.01"
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                onBlur={updateWeight}
                className="h-11 border border-input rounded-md px-4 bg-background min-w-[100px] font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
              </select>
            </div>
            
            {localAttributes.weight && (
              <div className="p-3 border rounded-lg bg-slate-50/50">
                <p className="text-sm">
                  <span className="font-medium">Current weight:</span>{' '}
                  <span className="text-muted-foreground">{localAttributes.weight}</span>
                </p>
              </div>
            )}
          </div>

          {/* Custom Attributes Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Custom Attributes</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Add any additional product specifications
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-slate-50/50">
              <AttributeEditor
                attributes={localAttributes}
                excludeKeys={["price_unit", "stock_unit", "colors", "sizes", "weight"]}
                onChange={(next) => setLocalAttributes(next)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-slate-50/50 gap-3 flex-row sm:flex-row">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel} 
            className="flex-1 h-11"
            size="lg"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            className="flex-1 h-11"
            size="lg"
          >
            Save Variations
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
