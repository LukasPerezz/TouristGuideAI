"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, X, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"

interface RecognitionResult {
  success: boolean;
  site: {
    id: string
    name: string
    location: string
    description: string
    historical_period: string
    cultural_significance: string
  }
  message: string
  confidence: number
}

interface User {
  id: string
}

interface PhotoCaptureProps {
  user?: User | null;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ user }) => {
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  // Simple speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState<"english" | "spanish">("english")
  const [duration, setDuration] = useState<1 | 3 | 5>(3)
  const [analysisMethod, setAnalysisMethod] = useState<"primary" | "secondary" | "tertiary">("primary")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Remove the complex speech synthesis initialization useEffect - no longer needed
  
  // Simple function to speak text
  const speakText = (text: string) => {
    try {
      // Check if speech synthesis is available
      if (!window.speechSynthesis) {
        alert('Speech synthesis not supported in this browser');
        return;
      }

      // Stop any current speech
      window.speechSynthesis.cancel();
      
      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'spanish' ? 'es-ES' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Started speaking');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Finished speaking');
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
      console.log('Speech started');
      
    } catch (error) {
      console.error('Error starting speech:', error);
      setIsSpeaking(false);
      alert('Error starting speech synthesis');
    }
  };

  // Simple function to stop speaking
  const stopSpeaking = () => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        console.log('Speech stopped');
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
      setIsSpeaking(false);
    }
  };

  const submitFeedback = async (isCorrect: boolean) => {
    console.log("Submit feedback called with:", isCorrect);
    console.log("Recognition result:", recognitionResult);
    
    if (!recognitionResult?.site) {
      console.error("No recognition result or site available");
      return;
    }

    try {
      console.log("Sending feedback to API...");
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCorrect,
          siteId: recognitionResult.site.id,
          recognizedSiteId: recognitionResult.site.id,
          confidence: recognitionResult.confidence,
          imageData: capturedImage,
        }),
      });

      console.log("Feedback API response status:", response.status);
      const result = await response.json();
      console.log("Feedback API response:", result);
      
      if (result.success) {
        const originalMessage = recognitionResult.message
        setRecognitionResult({
          ...recognitionResult,
          message: result.message,
        })

        setTimeout(() => {
          if (recognitionResult) {
            setRecognitionResult({
              ...recognitionResult,
              message: originalMessage,
            })
          }
        }, 2000)
      } else {
        console.error("Feedback submission failed:", result.error)
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      // Show user-friendly error message
      const originalMessage = recognitionResult.message
      setRecognitionResult({
        ...recognitionResult,
        message: "Feedback submission failed. Please try again.",
      })

      setTimeout(() => {
        if (recognitionResult) {
          setRecognitionResult({
            ...recognitionResult,
            message: originalMessage,
          })
        }
      }, 2000)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      setStream(mediaStream)
      setIsCameraOpen(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedImage(imageData)
        stopCamera()
        processImage(imageData)
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        processImage(imageData)
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (imageData: string) => {
    setIsProcessing(true)
    setRecognitionResult(null)
    setGeneratedContent(null)

    try {
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          method: analysisMethod,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json()
      
      if (result.success) {
        setRecognitionResult(result)
      } else {
        // Handle unsuccessful recognition
        setRecognitionResult({
          success: false,
          site: { id: "", name: "", location: "", description: "", historical_period: "", cultural_significance: "" },
          message: result.message || "Recognition failed",
          confidence: result.confidence || 0,
        })
      }
    } catch (error) {
      console.error("Error processing image:", error)
      setRecognitionResult({
        success: false,
        site: { id: "", name: "", location: "", description: "", historical_period: "", cultural_significance: "" },
        message: "Error processing image. Please try again.",
        confidence: 0,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const tryAgain = () => {
    if (capturedImage) {
      // Cycle through analysis methods
      const methods: ("primary" | "secondary" | "tertiary")[] = ["primary", "secondary", "tertiary"]
      const currentIndex = methods.indexOf(analysisMethod)
      const nextMethod = methods[(currentIndex + 1) % methods.length]
      setAnalysisMethod(nextMethod)
      processImage(capturedImage)
    }
  }

  const generateAudioGuide = async () => {
    if (!recognitionResult?.site) return;

    console.log("Starting audio guide generation for site:", recognitionResult.site);
    setIsGeneratingContent(true);
    
    try {
      console.log("Generating content...");
      const contentResponse = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: recognitionResult.site.id,
          siteName: recognitionResult.site.name,
          description: recognitionResult.site.description,
          historicalContext: recognitionResult.site.historical_period,
          culturalSignificance: recognitionResult.site.cultural_significance,
          locationCity: recognitionResult.site.location.includes(',') ? recognitionResult.site.location.split(', ')[0] : recognitionResult.site.location,
          locationCountry: recognitionResult.site.location.includes(',') ? recognitionResult.site.location.split(', ')[1] : "Unknown",
          constructionDate: recognitionResult.site.historical_period,
          architectArtist: "",
          funFacts: [],
          visitorTips: "",
          language,
          duration,
        }),
      });

      console.log("Content response status:", contentResponse.status);
      
      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        console.error("Content generation failed:", errorText);
        throw new Error(`Failed to generate content: ${contentResponse.status} ${errorText}`);
      }

      const contentResult = await contentResponse.json();
      console.log("Content result:", contentResult);
      
      if (contentResult.success) {
        setGeneratedContent(contentResult.script);
        console.log("Content generated successfully, ready for TTS playback");
        
        // Don't automatically start TTS - let user click the play button
        // speakContent(contentResult.script); // Removed automatic TTS
        
        console.log("Content ready for audio playback");
      } else {
        console.error('Content generation failed:', contentResult.error);
        throw new Error(`Content generation failed: ${contentResult.error}`);
      }
    } catch (error) {
      console.error("Error generating audio guide:", error);
      // Show user-friendly error message
      alert(`Failed to generate audio guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingContent(false);
      // setIsGeneratingAudio(false); // No longer needed
    }
  };

  const reset = () => {
    setCapturedImage(null)
    setRecognitionResult(null)
    setGeneratedContent(null)
    setAnalysisMethod("primary")
    stopSpeaking() // Stop any ongoing speech using the simple function
    stopCamera()
  }

  if (isCameraOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {/* Top controls */}
          <div className="flex justify-end">
            <Button
              onClick={stopCamera}
              variant="secondary"
              size="icon"
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Bottom controls */}
          <div className="flex justify-center pb-8">
            <Button
              onClick={capturePhoto}
              size="lg"
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black border-4 border-white"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl md:text-2xl">Discover Cultural Sites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!capturedImage && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={startCamera} size="lg" className="flex items-center gap-2 h-12 px-6 text-base">
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 h-12 px-6 text-base"
              >
                <Upload className="h-5 w-5" />
                Upload Image
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {capturedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                <Button onClick={reset} variant="secondary" size="sm" className="absolute top-2 right-2">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isProcessing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Analyzing your image...</p>
                </div>
              )}

              {recognitionResult && (
                <div className="space-y-4">
                  {recognitionResult.confidence > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-green-800">{recognitionResult.site.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{Math.round(recognitionResult.confidence * 100)}% confident</Badge>
                          <Button
                            onClick={tryAgain}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-transparent"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Try Again
                          </Button>
                        </div>
                      </div>

                      <p className="text-green-700 mb-3">{recognitionResult.message}</p>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-green-700">Was this recognition correct?</span>
                        <Button
                          onClick={() => submitFeedback(true)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-green-600 hover:text-green-700"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => submitFeedback(false)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Language:</span>
                          <div className="flex rounded-md border">
                            <button
                              onClick={() => setLanguage("english")}
                              className={`px-3 py-1 text-sm rounded-l-md ${
                                language === "english"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted"
                              }`}
                            >
                              English
                            </button>
                            <button
                              onClick={() => setLanguage("spanish")}
                              className={`px-3 py-1 text-sm rounded-r-md border-l ${
                                language === "spanish"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background hover:bg-muted"
                              }`}
                            >
                              Español
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Duration:</span>
                          <div className="flex rounded-md border">
                            {[1, 3, 5].map((min) => (
                              <button
                                key={min}
                                onClick={() => setDuration(min as 1 | 3 | 5)}
                                className={`px-3 py-1 text-sm ${
                                  min === 1 ? "rounded-l-md" : min === 5 ? "rounded-r-md" : ""
                                } ${min !== 1 ? "border-l" : ""} ${
                                  duration === min
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background hover:bg-muted"
                                }`}
                              >
                                {min}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={generateAudioGuide}
                        disabled={isGeneratingContent || isSpeaking}
                        className="w-full sm:w-auto"
                      >
                        {isGeneratingContent || isSpeaking
                          ? "Generating Audio Guide..."
                          : "Generate Audio Guide"}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 mb-3">{recognitionResult.message}</p>
                      <Button onClick={tryAgain} variant="outline" className="flex items-center gap-2 bg-transparent">
                        <RotateCcw className="h-4 w-4" />
                        Try Another Image
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {generatedContent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Generated Audio Guide</h4>
                  <p className="text-blue-700 text-sm mb-4">{generatedContent}</p>

                  {/* TTS Controls */}
                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      onClick={() => speakText(generatedContent)}
                      disabled={isSpeaking || !generatedContent}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSpeaking ? "Speaking..." : "🔊 Play Audio Guide"}
                    </Button>
                    
                    {/* Test button to verify TTS is working */}
                    <Button
                      onClick={() => {
                        console.log('Testing TTS...');
                        speakText('Hello, this is a test of speech synthesis.');
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      🧪 Test TTS
                    </Button>
                    
                    {isSpeaking && (
                      <Button
                        onClick={stopSpeaking}
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100"
                      >
                        ⏹️ Stop
                      </Button>
                    )}
                  </div>

                  {/* Status indicator */}
                  {isSpeaking && (
                    <div className="text-sm text-green-600 mb-4">
                      🔊 Currently reading the audio guide...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PhotoCapture
