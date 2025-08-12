"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Volume2, Download } from "lucide-react"

interface AudioPlayerProps {
  src: string // Changed from audioUrl to src for consistency
  title: string
  duration?: number // Add optional duration prop
  onDownload?: () => void
}

export function AudioPlayer({ src, title, duration: propDuration, onDownload }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(propDuration || 0) // Use prop duration as fallback
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      // Only update duration if the audio actually loaded and has a valid duration
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const restart = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    setCurrentTime(0)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-semibold text-slate-800 mb-2">{title}</h4>
            <div className="text-sm text-slate-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="w-full" />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button onClick={restart} variant="outline" size="sm" className="h-10 w-10 rounded-full p-0 bg-transparent">
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayPause}
              size="lg"
              className="h-12 w-12 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>

            {onDownload && (
              <Button
                onClick={onDownload}
                variant="outline"
                size="sm"
                className="h-10 w-10 rounded-full p-0 bg-transparent"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-slate-600" />
            <Slider value={[volume]} max={1} step={0.1} onValueChange={handleVolumeChange} className="flex-1" />
          </div>

          {/* Hidden Audio Element */}
          <audio ref={audioRef} src={src} preload="metadata" />
        </div>
      </CardContent>
    </Card>
  )
}

// Adding default export to satisfy import requirements
export default AudioPlayer
