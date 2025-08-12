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

export async function POST(request: NextRequest) {
  try {
  let buffer: Buffer | null = null;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.image) {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }
      const base64 = body.image.replace(/^data:.*;base64,/, "");
      buffer = Buffer.from(base64, "base64");
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

  // Use Google Cloud Vision API for landmark and label detection
  const client = new vision.ImageAnnotatorClient(getGCPCredentials());
  let landmarkResult, labelResult;
  let landmarks = [], labels = [];
  try {
    [landmarkResult] = await client.landmarkDetection({ image: { content: buffer } });
    landmarks = landmarkResult.landmarkAnnotations || [];
    [labelResult] = await client.labelDetection({ image: { content: buffer } });
    labels = labelResult.labelAnnotations || [];
  } catch (apiError) {
    console.error("Vision API error:", apiError);
    return NextResponse.json({
      success: false,
      message: "Vision API error: " + (apiError instanceof Error ? apiError.message : String(apiError)),
      confidence: 0,
      recognition_details: {},
      error_details: apiError,
    }, { status: 500 });
  }

  // Prefer landmark detection, fallback to label detection
  if (landmarks.length > 0) {
    const landmark = landmarks[0];
    return NextResponse.json({
      success: true,
      landmark: {
        description: landmark.description,
        score: landmark.score,
        locations: landmark.locations,
        boundingPoly: landmark.boundingPoly,
      },
      recognition_details: landmarks,
      labels,
    });
  } else if (labels.length > 0) {
    // If no landmark, show top label
    const label = labels[0];
    const score = typeof label.score === "number" ? label.score : 0;
    return NextResponse.json({
      success: false,
      message: `No landmark detected. Top label: ${label.description} (${Math.round(score * 100)}% confidence)`,
      confidence: score,
      recognition_details: labels,
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
