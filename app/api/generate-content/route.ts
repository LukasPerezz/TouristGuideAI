import { type NextRequest, NextResponse } from "next/server"

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
    console.log("Generate content API called");
    const body: GenerateContentRequest = await request.json()
    console.log("Request body:", body);

    const {
      siteId,
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

    // Validate required fields
    if (!siteId || !siteName) {
      console.error("Missing required fields:", { siteId, siteName });
      return NextResponse.json({ 
        success: false,
        error: "Site ID and name are required" 
      }, { status: 400 })
    }

    console.log("Generating script with parameters:", { siteName, language, duration });

    const isSpanish = language === "spanish"

    // Generate mock content based on site information and parameters
    const generatedScript = generateMockScript({
      siteName,
      description: description || "A remarkable cultural site",
      historicalContext: historicalContext || "This site has a rich historical background",
      culturalSignificance: culturalSignificance || "This site holds great cultural importance",
      locationCity: locationCity || "Unknown city",
      locationCountry: locationCountry || "Unknown country",
      constructionDate: constructionDate || "Unknown date",
      architectArtist: architectArtist || "Unknown",
      funFacts: funFacts || ["This site has fascinated visitors for generations"],
      visitorTips: visitorTips || "Take your time to explore and appreciate the site",
      isSpanish,
      duration,
    })

    console.log("Script generated successfully, length:", generatedScript.length);

    return NextResponse.json({
      success: true,
      script: generatedScript,
      cached: false,
    })
  } catch (error) {
    console.error("Content generation error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to generate content" 
    }, { status: 500 })
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

  // Generate English script based on duration with improved storytelling
  const hooks = [
    `Welcome to ${siteName}, one of ${locationCountry}'s most magnificent cultural treasures!`,
    `Standing before you is ${siteName}, a masterpiece that has captivated visitors for centuries.`,
    `You're about to discover the incredible story of ${siteName}, a testament to human creativity and ambition.`,
    `Prepare to be amazed by ${siteName}, where history, art, and culture converge in perfect harmony.`,
  ]

  const hook = hooks[Math.floor(Math.random() * hooks.length)]

  let script = `${hook}\n\n`

  // Add engaging description and historical context
  script += `${description} This remarkable structure, built in ${constructionDate}${architectArtist ? ` by the brilliant ${architectArtist}` : ""}, stands as a powerful symbol of ${culturalSignificance}.\n\n`

  // Add rich historical context with storytelling
  script += `Let me take you back in time. ${historicalContext} Imagine the world when this masterpiece was created - the people, the challenges, the vision that brought this incredible site to life.\n\n`

  // Add architectural and cultural details based on duration
  if (duration >= 3) {
    script += `As you explore ${siteName}, notice the intricate details that make it so extraordinary. Every stone, every carving, every architectural element tells a story of artistic mastery and cultural significance. The craftsmanship reflects not just technical skill, but a deep understanding of beauty and meaning.\n\n`
  }

  // Add fun facts based on duration with better storytelling
  const factsToInclude = duration === 1 ? 1 : duration === 3 ? 2 : 3
  const selectedFacts = funFacts.slice(0, factsToInclude)

  if (selectedFacts.length > 0) {
    script += `Here are some fascinating details that will make your visit even more special: ${selectedFacts.join(". ")}. These little-known facts add layers of wonder to an already extraordinary place.\n\n`
  }

  // Add visitor tips with context
  if (visitorTips) {
    script += `Before you continue your exploration, here's a helpful tip to enhance your experience: ${visitorTips}\n\n`
  }

  // Add emotional and cultural impact based on duration
  if (duration >= 3) {
    script += `Take a moment to reflect on what you're experiencing. ${siteName} isn't just a building or monument - it's a bridge between past and present, a living testament to human achievement. The countless stories these walls could tell, the history they've witnessed, and the legacy they continue to preserve for future generations make this place truly extraordinary.\n\n`
  }

  // Add location context
  script += `You're standing in ${locationCity}, a city that has been shaped by centuries of history and culture. ${siteName} is not just a landmark here - it's part of the city's soul, a symbol of its identity and heritage.\n\n`

  // Add closing with inspiration
  const closings = [
    `Thank you for visiting ${siteName}. May this experience inspire you to explore more of the world's cultural treasures and discover the stories that make our shared human heritage so remarkable.`,
    `As you leave ${siteName}, carry with you the sense of wonder and connection to history that this place embodies. Thank you for being part of its ongoing story.`,
    `Your visit to ${siteName} is now part of its living history. Thank you for taking the time to connect with this extraordinary place and the stories it tells.`
  ]

  script += closings[Math.floor(Math.random() * closings.length)]

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
    `¡Bienvenidos a ${siteName}, uno de los tesoros culturales más magníficos de ${locationCountry}!`,
    `Ante ustedes se encuentra ${siteName}, una obra maestra que ha cautivado a visitantes durante siglos.`,
    `Están a punto de descubrir la increíble historia de ${siteName}, un testimonio de la creatividad y ambición humana.`,
    `Prepárense para maravillarse con ${siteName}, donde la historia, el arte y la cultura convergen en perfecta armonía.`,
  ]

  const hook = hooks[Math.floor(Math.random() * hooks.length)]

  let script = `${hook}\n\n`

  // Add engaging description and historical context in Spanish
  script += `${description} Esta extraordinaria estructura, construida en ${constructionDate}${architectArtist ? ` por el brillante ${architectArtist}` : ""}, representa ${culturalSignificance}.\n\n`

  // Add rich historical context with storytelling
  script += `Permítanme llevarlos de vuelta en el tiempo. ${historicalContext} Imaginen el mundo cuando se creó esta obra maestra - las personas, los desafíos, la visión que dio vida a este increíble sitio.\n\n`

  // Add architectural and cultural details based on duration
  if (duration >= 3) {
    script += `Mientras exploran ${siteName}, noten los detalles intrincados que lo hacen tan extraordinario. Cada piedra, cada tallado, cada elemento arquitectónico cuenta una historia de maestría artística y significado cultural. La artesanía refleja no solo habilidad técnica, sino una profunda comprensión de la belleza y el significado.\n\n`
  }

  // Add fun facts based on duration with better storytelling
  const factsToInclude = duration === 1 ? 1 : duration === 3 ? 2 : 3
  const selectedFacts = funFacts.slice(0, factsToInclude)

  if (selectedFacts.length > 0) {
    script += `Aquí tienen algunos detalles fascinantes que harán su visita aún más especial: ${selectedFacts.join(". ")}. Estos hechos poco conocidos añaden capas de asombro a un lugar ya extraordinario.\n\n`
  }

  // Add visitor tips with context
  if (visitorTips) {
    script += `Antes de continuar su exploración, aquí tienen un consejo útil para mejorar su experiencia: ${visitorTips}\n\n`
  }

  // Add emotional and cultural impact based on duration
  if (duration >= 3) {
    script += `Tómense un momento para reflexionar sobre lo que están experimentando. ${siteName} no es solo un edificio o monumento - es un puente entre el pasado y el presente, un testimonio viviente del logro humano. Las innumerables historias que estas paredes podrían contar, la historia que han presenciado y el legado que continúan preservando para las futuras generaciones hacen de este lugar verdaderamente extraordinario.\n\n`
  }

  // Add location context
  script += `Están en ${locationCity}, una ciudad que ha sido moldeada por siglos de historia y cultura. ${siteName} no es solo un hito aquí - es parte del alma de la ciudad, un símbolo de su identidad y patrimonio.\n\n`

  // Add closing with inspiration
  const closings = [
    `Gracias por visitar ${siteName}. Que esta experiencia los inspire a explorar más de los tesoros culturales del mundo y descubrir las historias que hacen de nuestro patrimonio humano compartido algo tan notable.`,
    `Al salir de ${siteName}, lleven consigo la sensación de asombro y conexión con la historia que este lugar encarna. Gracias por ser parte de su historia en curso.`,
    `Su visita a ${siteName} es ahora parte de su historia viviente. Gracias por tomarse el tiempo de conectarse con este lugar extraordinario y las historias que cuenta.`
  ]

  script += closings[Math.floor(Math.random() * closings.length)]

  return script
}
