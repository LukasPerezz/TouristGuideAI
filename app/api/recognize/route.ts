import { type NextRequest, NextResponse } from "next/server";
import vision from '@google-cloud/vision';

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

// Mock cultural sites data for common landmarks
const MOCK_CULTURAL_SITES = {
  "colosseum": {
    id: "colosseum-001",
    name: "Colosseum",
    location: "Rome, Italy",
    description: "The largest amphitheater ever built, capable of holding 80,000 spectators",
    historical_period: "70-80 AD",
    cultural_significance: "Symbol of Imperial Rome and architectural innovation"
  },
  "eiffel tower": {
    id: "eiffel-001",
    name: "Eiffel Tower",
    location: "Paris, France",
    description: "Iron lattice tower and symbol of Paris",
    historical_period: "1889",
    cultural_significance: "Global icon of France and feat of 19th-century engineering"
  },
  "mona lisa": {
    id: "mona-lisa-001",
    name: "Mona Lisa",
    location: "Paris, France",
    description: "Leonardo da Vinci's masterpiece portrait, famous for her enigmatic smile",
    historical_period: "1503-1519",
    cultural_significance: "Most famous painting in the world, epitome of Renaissance art"
  },
  "neuschwanstein": {
    id: "neuschwanstein-001",
    name: "Neuschwanstein Castle",
    location: "Schwangau, Germany",
    description: "Fairy-tale castle built by King Ludwig II of Bavaria",
    historical_period: "1869-1886",
    cultural_significance: "Inspiration for Disney's Sleeping Beauty Castle"
  },
  "big ben": {
    id: "big-ben-001",
    name: "Big Ben",
    location: "London, England",
    description: "Iconic clock tower of the Palace of Westminster",
    historical_period: "1859",
    cultural_significance: "Symbol of London and British parliamentary democracy"
  },
  "sagrada familia": {
    id: "sagrada-familia-001",
    name: "Sagrada Familia",
    location: "Barcelona, Spain",
    description: "Antoni Gaudí's unfinished basilica masterpiece",
    historical_period: "1882-present",
    cultural_significance: "UNESCO World Heritage Site, symbol of Barcelona"
  }
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
        return NextResponse.json({ error: "No image provided" }, { status: 415 });
      }
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes as ArrayBuffer);
    } else {
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    }
    
    // Log buffer size for debugging
    console.log("Image buffer size:", buffer?.length, "bytes");

    // Use Google Cloud Vision API for landmark and label detection
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
      const landmarkName = (landmark.description || "").toLowerCase();
      
      // Try to find a matching cultural site
      let site = null;
      for (const [key, siteData] of Object.entries(MOCK_CULTURAL_SITES)) {
        if (landmarkName.includes(key) || key.includes(landmarkName)) {
          site = siteData;
          break;
        }
      }
      
      // If no exact match, try to find similar sites based on labels
      if (!site && labels.length > 0) {
        for (const label of labels) {
          const labelName = (label.description || "").toLowerCase();
          for (const [key, siteData] of Object.entries(MOCK_CULTURAL_SITES)) {
            if (labelName.includes(key) || key.includes(labelName)) {
              site = siteData;
              break;
            }
          }
          if (site) break;
        }
      }
      
      if (!site) {
        // Create a generic site based on the landmark
        site = {
          id: `landmark-${Date.now()}`,
          name: landmark.description || "Unknown landmark",
          location: "Unknown location",
          description: `A recognized landmark: ${landmark.description || "Unknown"}`,
          historical_period: "Unknown period",
          cultural_significance: "Recognized cultural landmark"
        };
      }
      
      // Return the data in the format expected by the PhotoCapture component
      return NextResponse.json({
        success: true,
        message: `Successfully recognized ${site.name}!`,
        confidence: landmark.score || 0,
        site: {
          id: site.id,
          name: site.name,
          location: site.location,
          description: site.description,
          historical_period: site.historical_period,
          cultural_significance: site.cultural_significance
        },
        recognition_details: landmarks,
        labels: labels.map(label => ({
          description: label.description || "Unknown label",
          score: label.score
        })),
        landmark: {
          description: landmark.description || "Unknown landmark",
          score: landmark.score,
          locations: landmark.locations,
          boundingPoly: landmark.boundingPoly,
        }
      });
      
    } else if (labels.length > 0) {
      // If no landmark, try to find a site based on labels
      const label = labels[0];
      const score = typeof label.score === "number" ? label.score : 0;
      
      // Try to find a matching cultural site based on labels
      let site = null;
      for (const [key, siteData] of Object.entries(MOCK_CULTURAL_SITES)) {
        if ((label.description || "").toLowerCase().includes(key) || key.includes((label.description || "").toLowerCase())) {
          site = siteData;
          break;
        }
      }
      
      if (site) {
        return NextResponse.json({
          success: true,
          message: `Recognized ${site.name} based on image analysis!`,
          confidence: score,
          site: {
            id: site.id,
            name: site.name,
            location: site.location,
            description: site.description,
            historical_period: site.historical_period,
            cultural_significance: site.cultural_significance
          },
          recognition_details: [],
          labels: labels.map(label => ({
            description: label.description || "Unknown label",
            score: label.score
          })),
        });
      }
      
      return NextResponse.json({
        success: false,
        message: `No landmark detected. Top label: ${label.description || "Unknown"} (${Math.round(score * 100)}% confidence)`,
        confidence: score,
        recognition_details: labels.map(label => ({
          description: label.description || "Unknown label",
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
        success: false,
        message: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
