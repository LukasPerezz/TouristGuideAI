import { type NextRequest, NextResponse } from "next/server"

// Mock TTS service for development
// In production, you would use ElevenLabs API or similar service
async function mockTextToSpeech(text: string, voice = "en-US-Standard-A", language = "english", durationMinutes = 1): Promise<Buffer> {
  try {
    // Simulate API processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create a valid WAV file that browsers can play
    // This generates speech-like audio patterns instead of just a single tone
    
    const sampleRate = 44100;
    const duration = durationMinutes * 60; // Convert minutes to seconds
    const numSamples = sampleRate * duration;
    
    // WAV file header (44 bytes) + audio data
    const buffer = Buffer.alloc(44 + numSamples * 2);
    
    // WAV header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4); // File size
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Chunk size
    buffer.writeUInt16LE(1, 20); // Audio format (PCM)
    buffer.writeUInt16LE(1, 22); // Number of channels (mono)
    buffer.writeUInt32LE(sampleRate, 24); // Sample rate
    buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
    buffer.writeUInt16LE(2, 32); // Block align
    buffer.writeUInt16LE(16, 34); // Bits per sample
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40); // Data chunk size
    
    // Generate speech-like audio patterns
    for (let i = 0; i < numSamples; i++) {
      const time = i / sampleRate;
      
      // Create varying frequencies to simulate speech patterns
      // Use multiple frequencies and vary them over time
      const baseFreq = 150 + Math.sin(time * 0.5) * 50; // Varying base frequency
      const highFreq = 800 + Math.sin(time * 1.2) * 200; // Higher frequency component
      const lowFreq = 80 + Math.sin(time * 0.3) * 30; // Lower frequency component
      
      // Combine multiple frequencies to create more natural sound
      const sample1 = Math.sin(2 * Math.PI * baseFreq * time) * 0.2;
      const sample2 = Math.sin(2 * Math.PI * highFreq * time) * 0.1;
      const sample3 = Math.sin(2 * Math.PI * lowFreq * time) * 0.15;
      
      // Add some randomness and variation
      const noise = (Math.random() - 0.5) * 0.05;
      
      // Combine all components
      const sample = sample1 + sample2 + sample3 + noise;
      
      // Add pauses to simulate speech patterns (every few seconds)
      const pauseInterval = 3; // Pause every 3 seconds
      const pauseDuration = 0.1; // 0.1 second pause
      const inPause = (time % pauseInterval) < pauseDuration;
      
      // Apply pause and limit amplitude
      const finalSample = inPause ? 0 : Math.max(-0.8, Math.min(0.8, sample));
      
      const sampleValue = Math.floor(finalSample * 32767);
      buffer.writeInt16LE(sampleValue, 44 + i * 2);
    }
    
    console.log(`Generated speech-like WAV audio buffer of size: ${buffer.length} bytes, duration: ${duration}s (${durationMinutes} minutes)`);
    return buffer;
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
    const audioBuffer = await mockTextToSpeech(script, voice, language, duration)
    console.log("Audio buffer generated, size:", audioBuffer.length);

    // Create a data URL that browsers can play
    // For mock purposes, we'll create a simple audio representation
    const mockAudioUrl = `data:audio/wav;base64,${audioBuffer.toString("base64")}`
    console.log("Mock audio URL created, length:", mockAudioUrl.length);

    // Calculate duration based on the selected duration parameter
    // The duration parameter represents minutes, so convert to seconds
    const selectedDurationSeconds = duration * 60; // Convert minutes to seconds
    
    // For mock audio, we'll use the actual generated audio duration
    // In production, this would come from the real TTS service
    const mockAudioDuration = duration * 60; // Use the selected duration for mock audio
    
    // Use the mock audio duration for now, but respect the selected duration for display
    const finalDuration = Math.max(selectedDurationSeconds, mockAudioDuration);
    
    console.log("Duration calculation:", {
      selectedDuration: duration,
      selectedDurationSeconds,
      mockAudioDuration,
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
