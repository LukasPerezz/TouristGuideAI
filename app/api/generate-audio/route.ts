import { type NextRequest, NextResponse } from "next/server"

// Mock TTS service for development
// In production, you would use ElevenLabs API or similar service
async function mockTextToSpeech(text: string, voice = "en-US-Standard-A", language = "english"): Promise<Buffer> {
  try {
    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, we'll create a simple audio buffer
    // In production, this would be replaced with actual TTS API call
    
    // Create a longer audio buffer to simulate real audio duration
    const baseAudioLength = Math.max(text.length * 2, 1000); // Minimum 1KB
    const mockAudioData = Buffer.alloc(baseAudioLength);
    
    // Fill the buffer with mock audio data
    for (let i = 0; i < mockAudioData.length; i++) {
      mockAudioData[i] = Math.floor(Math.random() * 256); // Random audio data
    }
    
    // Ensure we have a valid buffer
    if (!mockAudioData || mockAudioData.length === 0) {
      throw new Error("Failed to generate mock audio buffer");
    }
    
    console.log(`Generated mock audio buffer of size: ${mockAudioData.length} bytes`);
    return mockAudioData
  } catch (error) {
    console.error("Mock TTS error:", error);
    // Return a fallback audio buffer
    return Buffer.alloc(1000);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Generate audio API called");
    const { script, siteId, siteName, voice = "en-US-Standard-A", language = "english", duration = 1 } = await request.json()
    console.log("Audio request:", { siteId, siteName, scriptLength: script?.length, voice, language, duration });

    if (!script || !siteId) {
      console.error("Missing required fields:", { script: !!script, siteId });
      return NextResponse.json({ 
        success: false,
        error: "Script and site ID are required" 
      }, { status: 400 })
    }

    console.log("Generating audio with mock TTS...");
    // Generate new audio
    const audioBuffer = await mockTextToSpeech(script, voice, language)
    console.log("Audio buffer generated, size:", audioBuffer.length);

    // Create a data URL that browsers can play
    // For mock purposes, we'll create a simple audio representation
    const mockAudioUrl = `data:audio/wav;base64,${audioBuffer.toString("base64")}`
    console.log("Mock audio URL created, length:", mockAudioUrl.length);

    // Calculate duration based on the selected duration parameter
    // The duration parameter represents minutes, so convert to seconds
    const estimatedDuration = duration * 60; // Convert minutes to seconds
    
    // Also calculate a word-based estimate as backup
    const wordCount = script.split(" ").length
    const wordBasedDuration = Math.ceil((wordCount / 150) * 60); // 150 words per minute
    
    // Use the selected duration, but ensure it's reasonable
    const finalDuration = Math.max(estimatedDuration, wordBasedDuration);
    
    console.log("Duration calculation:", {
      selectedDuration: duration,
      selectedDurationSeconds: estimatedDuration,
      wordCount,
      wordBasedDuration,
      finalDuration
    });

    return NextResponse.json({
      success: true,
      audioUrl: mockAudioUrl,
      duration: finalDuration,
      cached: false,
    })
  } catch (error) {
    console.error("Audio generation error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to generate audio" 
    }, { status: 500 })
  }
}
