import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { error } = await supabase.from("user_profiles").upsert({
    id: user.id,
    email: user.email,
    role: user.email === "lukitas.p.11@gmail.com" ? "admin" : "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error creating profile:", error)
    return Response.json({ error: "Failed to create profile" }, { status: 500 })
  }

  return Response.json({ success: true, message: "Profile created successfully" })
}
