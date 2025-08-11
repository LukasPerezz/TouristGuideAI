"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User, History, Heart, Settings } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Header() {
  const [user, setUser] = useState<{ email: string; role?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser) {
        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", currentUser.id).single()

        setUser({
          email: currentUser.email || "",
          role: profile?.role || "user",
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single()

        setUser({
          email: session.user.email || "",
          role: profile?.role || "user",
        })
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isAdmin = user?.role === "admin"

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-800">
            Cultural Tourism AI
          </Link>

          <nav className="flex items-center space-x-4">
            {loading ? (
              <div className="text-slate-600">Loading...</div>
            ) : user ? (
              <>
                <Link href="/history" className="flex items-center text-slate-600 hover:text-slate-800">
                  <History className="h-4 w-4 mr-1" />
                  History
                </Link>
                <Link href="/favorites" className="flex items-center text-slate-600 hover:text-slate-800">
                  <Heart className="h-4 w-4 mr-1" />
                  Favorites
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center text-slate-600 hover:text-slate-800">
                    <Settings className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center text-slate-600 gap-2">
                  <User className="h-4 w-4" />
                  {user.email}
                  {isAdmin && (
                    <Badge variant="secondary" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
