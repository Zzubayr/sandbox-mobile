"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

export function SignupDebug() {
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const testDatabaseConnection = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase.from("vendors").select("count").limit(1)

      if (connectionError) {
        setDebugInfo(`Connection Error: ${connectionError.message}`)
        return
      }

      // Test trigger function exists
      const { data: functionTest, error: functionError } = await supabase.rpc("handle_new_vendor").select()

      setDebugInfo(`
Database Connection: ✅ Success
Vendors Table: ✅ Accessible
Trigger Function: ${functionError ? "❌ " + functionError.message : "✅ Available"}
      `)
    } catch (error) {
      setDebugInfo(`Debug Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testDatabaseConnection} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? "Testing..." : "Test Database"}
        </Button>
        {debugInfo && <pre className="mt-2 text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">{debugInfo}</pre>}
      </CardContent>
    </Card>
  )
}
