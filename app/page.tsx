import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import PhotoCapture from "@/components/photo-capture"

export default async function Home() {
  let user = null

  // Only try to get user if Supabase is configured
  if (isSupabaseConfigured) {
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Cultural Tourism AI Guide</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Discover the stories behind monuments, artworks, and cultural sites. Simply take a photo or upload an image
            to get an AI-powered audio tour guide.
          </p>
          {!user && (
            <p className="text-sm text-slate-500 mt-4">
              <Link href="/auth/sign-up" className="text-blue-600 hover:underline">
                Sign up
              </Link>{" "}
              to save your discoveries and create a personal travel history.
            </p>
          )}
        </div>

        <PhotoCapture user={user} />
      </main>
    </div>
  )
}
