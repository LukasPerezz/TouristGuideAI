"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, Clock, Volume2, Heart } from "lucide-react"
import { useState } from "react"
import AudioPlayer from "./audio-player"

interface Recognition {
  id: string
  recognition_confidence: number
  audio_url: string
  audio_duration: number
  generated_script: string
  recognized_at: string
  cultural_sites: {
    id: string
    name: string
    description: string
    location_city: string
    location_country: string
    site_type: string
    construction_date: string
    architect_artist: string
  }
}

interface HistoryListProps {
  recognitions: Recognition[]
}

export default function HistoryList({ recognitions }: HistoryListProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
      setPlayingAudio(null)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const toggleAudio = (id: string) => {
    setPlayingAudio(playingAudio === id ? null : id)
  }

  const addToFavorites = async (siteId: string) => {
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ culturalSiteId: siteId }),
      })

      if (response.ok) {
        alert("Added to favorites!")
      } else {
        alert("Failed to add to favorites")
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      alert("Failed to add to favorites")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (recognitions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-slate-500">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No discoveries yet</h3>
            <p>Start exploring cultural sites to build your personal discovery history.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {recognitions.map((recognition) => (
        <Card key={recognition.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{recognition.cultural_sites.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {recognition.cultural_sites.location_city}, {recognition.cultural_sites.location_country}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {recognition.cultural_sites.construction_date}
                    </div>
                    {recognition.cultural_sites.architect_artist && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {recognition.cultural_sites.architect_artist}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(recognition.recognized_at)}
                    </div>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {Math.round(recognition.recognition_confidence * 100)}% confidence
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => addToFavorites(recognition.cultural_sites.id)}
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => toggleExpanded(recognition.id)}
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                  >
                    {expandedItems.has(recognition.id) ? "Hide Details" : "View Details"}
                  </Button>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed">{recognition.cultural_sites.description}</p>

              {expandedItems.has(recognition.id) && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-800 mb-2">Generated Audio Guide Script</h4>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                      {recognition.generated_script}
                    </p>
                  </div>

                  {playingAudio === recognition.id ? (
                    <AudioPlayer
                      audioUrl={recognition.audio_url}
                      duration={recognition.audio_duration}
                      title={`${recognition.cultural_sites.name} Audio Guide`}
                      onDownload={() => {
                        const link = document.createElement("a")
                        link.href = recognition.audio_url
                        link.download = `${recognition.cultural_sites.name}.wav`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <Button
                        onClick={() => toggleAudio(recognition.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Volume2 className="h-4 w-4 mr-2" />
                        Play Audio Guide
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
