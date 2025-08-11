import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { isCorrect, siteId, recognizedSiteId, imageData, confidence } = await request.json()

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Store feedback in database
    const { error: insertError } = await supabase.from("recognition_feedback").insert({
      user_id: user.id,
      actual_site_id: siteId,
      recognized_site_id: recognizedSiteId,
      is_correct: isCorrect,
      confidence_score: confidence,
      image_hash: imageData ? btoa(imageData.substring(0, 100)) : null,
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error storing feedback:", insertError)
      return NextResponse.json({ error: "Failed to store feedback" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: isCorrect ? "Thank you for confirming!" : "Thanks for the feedback, we'll improve our recognition!",
    })
  } catch (error) {
    console.error("Feedback error:", error)
    return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 })
  }
}
