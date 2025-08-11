import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateProfileButton } from "@/components/create-profile-button"

export default async function DebugAdminPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profiles, error: profileError } = await supabase.from("user_profiles").select("*").eq("id", user.id)

  const { data: profilesByEmail, error: emailError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("email", user.email)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Information</h1>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current User (Auth)</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(
              {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Profile (by ID)</h2>
          {profileError ? (
            <p className="text-red-600">Error: {profileError.message}</p>
          ) : profiles && profiles.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">Found {profiles.length} profile(s)</p>
              <pre className="text-sm overflow-auto">{JSON.stringify(profiles, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-yellow-600">No profile found for user ID</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Profile (by Email)</h2>
          {emailError ? (
            <p className="text-red-600">Error: {emailError.message}</p>
          ) : profilesByEmail && profilesByEmail.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-2">Found {profilesByEmail.length} profile(s)</p>
              <pre className="text-sm overflow-auto">{JSON.stringify(profilesByEmail, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-yellow-600">No profile found for email: {user.email}</p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Expected Admin Email</h2>
          <p>lukitas.p.11@gmail.com</p>
          <p className="text-sm text-gray-600">
            Current email: {user.email}
            {user.email === "lukitas.p.11@gmail.com" ? " ✅ Match" : " ❌ No match"}
          </p>
        </div>

        {(!profiles || profiles.length === 0) && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">No Profile Found</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your user profile wasn't created automatically. This might be due to the trigger not working properly.
            </p>
            <CreateProfileButton />
          </div>
        )}
      </div>
    </div>
  )
}
