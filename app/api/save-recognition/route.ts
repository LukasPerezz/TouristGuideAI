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

    const { culturalSiteId, imageUrl, recognitionConfidence, audioUrl, audioDuration, generatedScript } =
      await request.json()

    // Save recognition to user history
    const { error } = await supabase.from("user_recognitions").insert({
      user_id: user.id,
      cultural_site_id: culturalSiteId,
      image_url: imageUrl,
      recognition_confidence: recognitionConfidence,
      audio_url: audioUrl,
      audio_duration: audioDuration,
      generated_script: generatedScript,
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save recognition" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save recognition error:", error)
    return NextResponse.json({ error: "Failed to save recognition" }, { status: 500 })
  }
}
