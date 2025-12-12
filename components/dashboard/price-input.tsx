"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PriceInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number
  onChange: (value: string) => void
}

export function PriceInput({ className, value, onChange, ...props }: PriceInputProps) {
  // Format the display value with commas
  const formatDisplayValue = (val: string | number) => {
    if (!val && val !== 0) return ""
    
    // Convert to string and split into integer and decimal parts
    const parts = val.toString().split(".")
    const integerPart = parts[0]
    const decimalPart = parts.length > 1 ? "." + parts[1] : ""
    
    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    
    return `₦${formattedInteger}${decimalPart}`
  }

  const [displayValue, setDisplayValue] = React.useState(formatDisplayValue(value))

  // Update display value when prop changes externally (e.g. initial load)
  React.useEffect(() => {
    setDisplayValue(formatDisplayValue(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Remove "₦" and commas to get raw input
    const rawInput = inputValue.replace(/₦|,/g, "")
    
    // Allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(rawInput)) return

    // Limit decimal places to 2
    if (rawInput.includes(".") && rawInput.split(".")[1].length > 2) return

    // Update parent with raw value (or empty string)
    onChange(rawInput)
    
    // Update local display value immediately for smooth typing
    // If empty, clear display. If just ".", show "₦0." (optional, or just wait for effect)
    if (rawInput === "") {
      setDisplayValue("")
    } else if (rawInput === ".") {
        onChange("0.")
        setDisplayValue("₦0.")
    } else {
        // We construct the display value manually here to keep cursor position better handled by standard behavior 
        // effectively re-running the formatter
        setDisplayValue(formatDisplayValue(rawInput))
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      className={cn("font-medium", className)}
      {...props}
    />
  )
}
