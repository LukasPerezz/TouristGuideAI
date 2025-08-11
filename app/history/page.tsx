import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import HistoryList from "@/components/history-list"

export default async function HistoryPage() {
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

  // Fetch user's recognition history
  const { data: recognitions, error } = await supabase
    .from("user_recognitions")
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
        architect_artist
      )
    `)
    .eq("user_id", user.id)
    .order("recognized_at", { ascending: false })

  if (error) {
    console.error("Error fetching history:", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Discovery History</h1>
            <p className="text-lg text-slate-600">
              Revisit the cultural sites you've explored and replay your personalized audio guides.
            </p>
          </div>

          <HistoryList recognitions={recognitions || []} />
        </div>
      </main>
    </div>
  )
}
