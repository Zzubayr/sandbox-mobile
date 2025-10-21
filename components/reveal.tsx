"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"

type RevealProps = {
  children: ReactNode
  className?: string
  /** direction of initial offset */
  direction?: "up" | "down" | "left" | "right" | "fade"
  /** whether to only animate once */
  once?: boolean
  /** delay in ms */
  delay?: number
}

export function Reveal({ children, className = "", direction = "up", once = true, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delay)
            if (once) io.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold: 0.12 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, delay])

  const base = "transition-all duration-700 ease-out will-change-transform will-change-opacity"
  const hiddenMap: Record<NonNullable<RevealProps["direction"]>, string> = {
    up: "translate-y-6 opacity-0",
    down: "-translate-y-6 opacity-0",
    left: "translate-x-6 opacity-0",
    right: "-translate-x-6 opacity-0",
    fade: "opacity-0",
  }
  const shown = "translate-x-0 translate-y-0 opacity-100"
  const hidden = hiddenMap[direction]

  return (
    <div ref={ref} className={`${base} ${visible ? shown : hidden} ${className}`}>
      {children}
    </div>
  )
}

