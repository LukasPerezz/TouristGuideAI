import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { culturalSiteId } = await request.json()

    if (!culturalSiteId) {
      return NextResponse.json({ error: "Cultural site ID is required" }, { status: 400 })
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("user_favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("cultural_site_id", culturalSiteId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Site already in favorites" }, { status: 400 })
    }

    // Add to favorites
    const { error } = await supabase.from("user_favorites").insert({
      user_id: user.id,
      cultural_site_id: culturalSiteId,
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to add to favorites" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Add to favorites error:", error)
    return NextResponse.json({ error: "Failed to add to favorites" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { culturalSiteId } = await request.json()

    if (!culturalSiteId) {
      return NextResponse.json({ error: "Cultural site ID is required" }, { status: 400 })
    }

    // Remove from favorites
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("cultural_site_id", culturalSiteId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to remove from favorites" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove from favorites error:", error)
    return NextResponse.json({ error: "Failed to remove from favorites" }, { status: 500 })
  }
}
