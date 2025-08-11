"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function CreateProfileButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleCreateProfile = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Profile created successfully!")
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage("Failed to create profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleCreateProfile} disabled={isLoading} className="mb-2">
        {isLoading ? "Creating..." : "Create Profile Manually"}
      </Button>
      {message && (
        <p className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-green-600"}`}>{message}</p>
      )}
    </div>
  )
}
