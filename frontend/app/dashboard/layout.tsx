"use client"

import type React from "react"
import AttendanceGuard from "@/components/attendance-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AttendanceGuard>
      {children}
    </AttendanceGuard>
  )
}
