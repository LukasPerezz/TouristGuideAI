import { type NextRequest, NextResponse } from "next/server";
import vision from '@google-cloud/vision';
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
// Helper to get credentials from Vercel environment variables
const getGCPCredentials = () => {
  return process.env.GCP_PRIVATE_KEY
    ? {
        credentials: {
          client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GCP_PRIVATE_KEY,
        },
        projectId: process.env.GCP_PROJECT_ID,
      }
    : {};
};

export async function POST(request: NextRequest) {
  try {
  let buffer: Buffer | null = null;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      // More precise base64 extraction
      const base64 = body.image.split(';base64,').pop() || '';
      buffer = Buffer.from(base64, 'base64');
      console.log('Base64 image length:', base64.length);
      console.log('First 50 chars of base64:', base64.substring(0, 50));
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const file = formData.get("image") as File;
      if (!file) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes as ArrayBuffer);
    } else {
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    }
    // Log buffer size for debugging
    console.log("Image buffer size:", buffer?.length, "bytes");

  // Use Google Cloud Vision API for landmark and label detection with increased timeout
  const client = new vision.ImageAnnotatorClient({
    ...getGCPCredentials()
  });
  let landmarkResult, labelResult;
  let landmarks = [], labels = [];
  try {
    console.log('Making Vision API calls...');
    
    // Try landmark detection first
    console.log('Calling landmarkDetection...');
    [landmarkResult] = await client.landmarkDetection({
      image: { content: buffer },
      imageContext: {
        languageHints: ['en'],
      }
    });
    console.log('Raw landmark result:', JSON.stringify(landmarkResult, null, 2));
    landmarks = Array.isArray(landmarkResult.landmarkAnnotations) ? landmarkResult.landmarkAnnotations : [];
    console.log(`Found ${landmarks.length} landmarks`);
    
    // Then try label detection
    console.log('Calling labelDetection...');
    [labelResult] = await client.labelDetection({
      image: { content: buffer },
      imageContext: {
        languageHints: ['en'],
      }
    });
    labels = Array.isArray(labelResult.labelAnnotations) ? labelResult.labelAnnotations : [];
    console.log(`Found ${labels.length} labels`);
    
    if (landmarks.length > 0) {
      console.log('Landmarks found:', landmarks.map(l => `${l.description} (${l.score})`));
    }
    if (labels.length > 0) {
      console.log('Labels found:', labels.map(l => `${l.description} (${l.score})`));
    }
  } catch (apiError) {
    let errorMsg = "Vision API error: " + (apiError instanceof Error ? apiError.message : String(apiError));
    if (apiError && typeof apiError === "object" && "code" in apiError) {
      errorMsg += ` (code: ${apiError.code})`;
    }
    console.error("Vision API error:", apiError);
    return NextResponse.json({
      success: false,
      message: errorMsg,
      confidence: 0,
      recognition_details: {},
      error_details: apiError,
    }, { status: 500 });
  }

  // Prefer landmark detection, fallback to label detection
  if (landmarks.length > 0) {
    const landmark = landmarks[0];
    
    // Get site information from database based on landmark
    const supabase = createClient();
    
    // Make sure Supabase is configured
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        message: "Database configuration not available",
        confidence: 0,
      });
    }
    
    // Use type assertion since we know the client is properly configured
    const { data: siteData } = await (supabase as any)
      .from('cultural_sites')
      .select('*')
      .ilike('name', `%${landmark.description}%`)
      .single();

    if (!siteData) {
      return NextResponse.json({
        success: false,
        message: "Site information not found in database",
        confidence: 0,
      });
    }

    // Generate content first
    const contentResponse = await fetch(`${request.nextUrl.origin}/api/generate-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: siteData.id,
        siteName: siteData.name,
        description: siteData.description,
        historicalContext: siteData.historical_context,
        culturalSignificance: siteData.cultural_significance,
        locationCity: siteData.location_city,
        locationCountry: siteData.location_country,
        constructionDate: siteData.construction_date,
        architectArtist: siteData.architect_artist,
        funFacts: siteData.fun_facts || [],
        visitorTips: siteData.visitor_tips,
      }),
    });

    if (!contentResponse.ok) {
      throw new Error('Failed to generate content');
    }

    const contentData = await contentResponse.json();

    // Generate audio
    const audioResponse = await fetch(`${request.nextUrl.origin}/api/generate-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: contentData.script,
        siteId: siteData.id,
        siteName: siteData.name,
      }),
    });

    if (!audioResponse.ok) {
      throw new Error('Failed to generate audio');
    }

    const audioData = await audioResponse.json();

    return NextResponse.json({
      success: true,
      message: `Generated audio guide for ${landmark.description} (${Math.round((landmark.score || 0) * 100)}% confidence)`,
      landmark: {
        description: landmark.description,
        score: landmark.score,
        locations: landmark.locations,
        boundingPoly: landmark.boundingPoly,
      },
      recognition_details: landmarks,
      labels: labels.map(label => ({
        description: label.description,
        score: label.score
      })),
      content: contentData,
      audio: {
        url: audioData.audioUrl,
        duration: audioData.duration
      }
    });
  } else if (labels.length > 0) {
    // If no landmark, show top label
    const label = labels[0];
    const score = typeof label.score === "number" ? label.score : 0;
    return NextResponse.json({
      success: false,
      message: `No landmark detected. Top label: ${label.description} (${Math.round(score * 100)}% confidence)`,
      confidence: score,
      recognition_details: labels.map(label => ({
        description: label.description,
        score: label.score
      })),
    });
  } else {
    return NextResponse.json({
      success: false,
      message: "No landmark or recognizable object detected. Try a different image.",
      confidence: 0,
      recognition_details: {},
    });
  }
  } catch (error) {
    console.error("Recognition error:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
