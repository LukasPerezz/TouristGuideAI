"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, User, Heart, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Favorite {
  id: string
  favorited_at: string
  cultural_sites: {
    id: string
    name: string
    description: string
    location_city: string
    location_country: string
    site_type: string
    construction_date: string
    architect_artist: string
    cultural_significance: string
    visitor_tips: string
  }
}

interface FavoritesListProps {
  favorites: Favorite[]
}

export default function FavoritesList({ favorites: initialFavorites }: FavoritesListProps) {
  const [favorites, setFavorites] = useState(initialFavorites)
  const [removingFavorite, setRemovingFavorite] = useState<string | null>(null)
  const router = useRouter()

  const removeFromFavorites = async (favoriteId: string, siteId: string) => {
    setRemovingFavorite(favoriteId)

    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ culturalSiteId: siteId }),
      })

      if (response.ok) {
        setFavorites(favorites.filter((fav) => fav.id !== favoriteId))
      } else {
        alert("Failed to remove from favorites")
      }
    } catch (error) {
      console.error("Error removing from favorites:", error)
      alert("Failed to remove from favorites")
    } finally {
      setRemovingFavorite(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-slate-500">
            <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
            <p className="mb-4">Start exploring cultural sites and add them to your favorites collection.</p>
            <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Discover Sites
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {favorites.map((favorite) => (
        <Card key={favorite.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{favorite.cultural_sites.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {favorite.cultural_sites.location_city}, {favorite.cultural_sites.location_country}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {favorite.cultural_sites.construction_date}
                    </div>
                    {favorite.cultural_sites.architect_artist && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {favorite.cultural_sites.architect_artist}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    Added to favorites on {formatDate(favorite.favorited_at)}
                  </div>
                </div>

                <Button
                  onClick={() => removeFromFavorites(favorite.id, favorite.cultural_sites.id)}
                  disabled={removingFavorite === favorite.id}
                  variant="outline"
                  size="sm"
                  className="bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-slate-700 leading-relaxed">{favorite.cultural_sites.description}</p>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Cultural Significance</h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {favorite.cultural_sites.cultural_significance}
                  </p>
                </div>

                {favorite.cultural_sites.visitor_tips && (
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Visitor Tips</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">{favorite.cultural_sites.visitor_tips}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
