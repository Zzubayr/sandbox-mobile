"use client"

import React, { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

export type AttributeMap = Record<string, string[]>

interface AttributeEditorProps {
  attributes: Record<string, any>
  onChange: (next: AttributeMap) => void
  excludeKeys?: string[]
}

export function AttributeEditor({ attributes, onChange, excludeKeys = [] }: AttributeEditorProps) {
  // Normalize incoming attributes into string[] while filtering excluded keys
  const normalized = useMemo<AttributeMap>(() => {
    const out: AttributeMap = {}
    if (!attributes) return out
    for (const [rawKey, rawVal] of Object.entries(attributes)) {
      if (excludeKeys.includes(rawKey)) continue
      const key = String(rawKey)
      if (Array.isArray(rawVal)) {
        out[key] = rawVal.map(v => String(v)).filter(Boolean)
      } else if (typeof rawVal === 'string') {
        out[key] = rawVal ? [rawVal] : []
      } else if (rawVal == null) {
        out[key] = []
      } else {
        out[key] = [String(rawVal)]
      }
    }
    return out
  }, [attributes, excludeKeys])

  const [newKey, setNewKey] = useState("")
  const [newValues, setNewValues] = useState("")

  const commit = (next: AttributeMap) => {
    onChange(next)
  }

  const addKey = () => {
    const key = newKey.trim().toLowerCase().replace(/\s+/g, "_")
    if (!key) return
    const values = newValues
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
    const next: AttributeMap = { ...normalized }
    if (!next[key]) next[key] = []
    const set = new Set<string>([...next[key], ...values])
    next[key] = Array.from(set)
    commit(next)
    setNewKey("")
    setNewValues("")
  }

  const addValue = (key: string, valueLine: string) => {
    const values = valueLine
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
    if (values.length === 0) return
    const next: AttributeMap = { ...normalized }
    const set = new Set<string>([...(next[key] || []), ...values])
    next[key] = Array.from(set)
    commit(next)
  }

  const removeValue = (key: string, value: string) => {
    const next: AttributeMap = { ...normalized }
    next[key] = (next[key] || []).filter(v => v !== value)
    commit(next)
  }

  const removeKey = (key: string) => {
    const next: AttributeMap = { ...normalized }
    delete next[key]
    commit(next)
  }

  return (
    <div className="space-y-4">
      {/* Add new key */}
      <div className="flex gap-2">
        <Input
          placeholder="Attribute name (e.g., Material)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <Input
          placeholder="Values (e.g., Cotton, Silk)"
          value={newValues}
          onChange={(e) => setNewValues(e.target.value)}
        />
        <Button onClick={addKey} disabled={!newKey && !newValues}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-500 -mt-2">Separate multiple values with commas</p>

      {/* Existing keys */}
      {Object.keys(normalized).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-slate-700">Current Attributes</h4>
          {Object.entries(normalized).map(([key, values]) => (
            <div key={key} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-medium text-slate-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeKey(key)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {(values || []).map((val) => (
                  <span key={val} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white border border-slate-200">
                    {val}
                    <button
                      type="button"
                      onClick={() => removeValue(key, val)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Remove ${val}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* add more values */}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add values (e.g., Red, Blue)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const target = e.target as HTMLInputElement
                      addValue(key, target.value)
                      target.value = ""
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const wrapper = (e.currentTarget.parentElement as HTMLElement)
                    const input = wrapper.querySelector('input') as HTMLInputElement | null
                    if (!input) return
                    addValue(key, input.value)
                    input.value = ""
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Press Enter or click Add. Separate multiple values with commas</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
