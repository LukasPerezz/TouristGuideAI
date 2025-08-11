import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User } from "lucide-react"

export default async function AdminSites() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  // Get all cultural sites
  const { data: sites } = await supabase.from("cultural_sites").select("*").order("created_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Cultural Sites</h1>
          <p className="text-muted-foreground">Add, edit, and manage cultural sites in the database</p>
        </div>
        <Button>Add New Site</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites?.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{site.name}</CardTitle>
                <Badge variant="outline">{site.site_type}</Badge>
              </div>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {site.location_city}, {site.location_country}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{site.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                {site.construction_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {site.construction_date}
                  </div>
                )}
                {site.architect_artist && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {site.architect_artist}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
