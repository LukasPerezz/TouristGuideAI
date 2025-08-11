import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface GenerateContentRequest {
  siteId: string
  siteName: string
  description: string
  historicalContext: string
  culturalSignificance: string
  locationCity: string
  locationCountry: string
  constructionDate: string
  architectArtist: string
  funFacts: string[]
  visitorTips: string
  language?: string
  duration?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json()

    const {
      siteName,
      description,
      historicalContext,
      culturalSignificance,
      locationCity,
      locationCountry,
      constructionDate,
      architectArtist,
      funFacts,
      visitorTips,
      language = "english",
      duration = 3,
    } = body

    // Check cache first
    const supabase = createClient()
    const contentHash = Buffer.from(
      JSON.stringify({
        siteName,
        language,
        duration,
        type: "audio_script",
      }),
    ).toString("base64")

    const { data: cachedContent } = await supabase
      .from("content_cache")
      .select("content_data")
      .eq("content_hash", contentHash)
      .eq("content_type", "script")
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cachedContent) {
      return NextResponse.json({
        success: true,
        script: JSON.parse(cachedContent.content_data).script,
        cached: true,
      })
    }

    const isSpanish = language === "spanish"

    // Generate mock content based on site information and parameters
    const generatedScript = generateMockScript({
      siteName,
      description,
      historicalContext,
      culturalSignificance,
      locationCity,
      locationCountry,
      constructionDate,
      architectArtist,
      funFacts,
      visitorTips,
      isSpanish,
      duration,
    })

    // Cache the generated content
    await supabase.from("content_cache").insert({
      cultural_site_id: body.siteId,
      content_type: "script",
      content_hash: contentHash,
      content_data: JSON.stringify({ script: generatedScript }),
      language: isSpanish ? "es" : "en",
    })

    return NextResponse.json({
      success: true,
      script: generatedScript,
      cached: false,
    })
  } catch (error) {
    console.error("Content generation error:", error)
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 })
  }
}

function generateMockScript(params: {
  siteName: string
  description: string
  historicalContext: string
  culturalSignificance: string
  locationCity: string
  locationCountry: string
  constructionDate: string
  architectArtist: string
  funFacts: string[]
  visitorTips: string
  isSpanish: boolean
  duration: number
}): string {
  const {
    siteName,
    description,
    historicalContext,
    culturalSignificance,
    locationCity,
    locationCountry,
    constructionDate,
    architectArtist,
    funFacts,
    visitorTips,
    isSpanish,
    duration,
  } = params

  if (isSpanish) {
    return generateSpanishScript(params)
  }

  // Generate English script based on duration
  const hooks = [
    `Welcome to ${siteName}, one of ${locationCountry}'s most magnificent treasures!`,
    `Standing before you is ${siteName}, a testament to human creativity and ambition.`,
    `You're about to discover the incredible story of ${siteName}, a masterpiece that has captivated visitors for centuries.`,
  ]

  const hook = hooks[Math.floor(Math.random() * hooks.length)]

  let script = `${hook}\n\n`

  // Add description and historical context
  script += `${description} Built in ${constructionDate}${architectArtist ? ` by ${architectArtist}` : ""}, this remarkable structure stands as a symbol of ${culturalSignificance}.\n\n`

  // Add historical context
  script += `${historicalContext} `

  // Add fun facts based on duration
  const factsToInclude = duration === 1 ? 1 : duration === 3 ? 2 : 3
  const selectedFacts = funFacts.slice(0, factsToInclude)

  if (selectedFacts.length > 0) {
    script += `Here are some fascinating details you might not know: ${selectedFacts.join(". ")}.\n\n`
  }

  // Add architectural details
  script += `As you look around, notice the intricate details that make ${siteName} so special. The craftsmanship and attention to detail reflect the artistic mastery of its time.\n\n`

  // Add visitor tips
  if (visitorTips) {
    script += `Before you continue exploring, here's a helpful tip: ${visitorTips}\n\n`
  }

  // Add closing based on duration
  if (duration >= 3) {
    script += `Take a moment to imagine the countless stories these walls could tell, the history they've witnessed, and the legacy they continue to preserve for future generations.\n\n`
  }

  script += `Thank you for visiting ${siteName}. Enjoy the rest of your cultural journey through ${locationCity}!`

  return script
}

function generateSpanishScript(params: {
  siteName: string
  description: string
  historicalContext: string
  culturalSignificance: string
  locationCity: string
  locationCountry: string
  constructionDate: string
  architectArtist: string
  funFacts: string[]
  visitorTips: string
  duration: number
}): string {
  const {
    siteName,
    description,
    historicalContext,
    culturalSignificance,
    locationCity,
    locationCountry,
    constructionDate,
    architectArtist,
    funFacts,
    visitorTips,
    duration,
  } = params

  const hooks = [
    `¡Bienvenidos a ${siteName}, uno de los tesoros más magníficos de ${locationCountry}!`,
    `Ante ustedes se encuentra ${siteName}, un testimonio de la creatividad y ambición humana.`,
    `Están a punto de descubrir la increíble historia de ${siteName}, una obra maestra que ha cautivado a visitantes durante siglos.`,
  ]

  const hook = hooks[Math.floor(Math.random() * hooks.length)]

  let script = `${hook}\n\n`

  // Add description and historical context in Spanish
  script += `${description} Construido en ${constructionDate}${architectArtist ? ` por ${architectArtist}` : ""}, esta estructura extraordinaria representa ${culturalSignificance}.\n\n`

  // Add historical context
  script += `${historicalContext} `

  // Add fun facts based on duration
  const factsToInclude = duration === 1 ? 1 : duration === 3 ? 2 : 3
  const selectedFacts = funFacts.slice(0, factsToInclude)

  if (selectedFacts.length > 0) {
    script += `Aquí tienen algunos detalles fascinantes que quizás no conocían: ${selectedFacts.join(". ")}.\n\n`
  }

  // Add architectural details
  script += `Mientras observan a su alrededor, noten los detalles intrincados que hacen de ${siteName} algo tan especial. La artesanía y atención al detalle reflejan la maestría artística de su época.\n\n`

  // Add visitor tips
  if (visitorTips) {
    script += `Antes de continuar explorando, aquí tienen un consejo útil: ${visitorTips}\n\n`
  }

  // Add closing based on duration
  if (duration >= 3) {
    script += `Tómense un momento para imaginar las innumerables historias que estas paredes podrían contar, la historia que han presenciado y el legado que continúan preservando para las futuras generaciones.\n\n`
  }

  script += `Gracias por visitar ${siteName}. ¡Disfruten el resto de su viaje cultural por ${locationCity}!`

  return script
}
