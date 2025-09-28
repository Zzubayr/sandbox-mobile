import { Wrench, Clock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Wrench className="h-16 w-16 text-primary animate-pulse" />
                <Clock className="h-6 w-6 text-muted-foreground absolute -bottom-1 -right-1" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Under Maintenance</h1>
              <p className="text-muted-foreground">
                We're currently performing scheduled maintenance to improve your experience. We'll be back online
                shortly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Expected downtime: A while</div>

              <Button variant="outline" className="w-full bg-transparent" asChild>
                <a href="mailto:ummahsquare2@gmail.com" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </a>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">Status updates: status.ummahsquare.com.ng</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
