import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FavoritesList from "@/components/favorites-list"

export default async function FavoritesPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">Connect Supabase to get started</h1>
      </div>
    )
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's favorite cultural sites
  const { data: favorites, error } = await supabase
    .from("user_favorites")
    .select(`
      *,
      cultural_sites (
        id,
        name,
        description,
        location_city,
        location_country,
        site_type,
        construction_date,
        architect_artist,
        cultural_significance,
        visitor_tips
      )
    `)
    .eq("user_id", user.id)
    .order("favorited_at", { ascending: false })

  if (error) {
    console.error("Error fetching favorites:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Favorite Sites</h1>
            <p className="text-lg text-slate-600">
              Cultural sites and monuments you've marked as favorites for future reference.
            </p>
          </div>

          <FavoritesList favorites={favorites || []} />
        </div>
      </main>
    </div>
  )
}
