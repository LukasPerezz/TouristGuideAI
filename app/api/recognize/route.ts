import { type NextRequest, NextResponse } from "next/server";
import vision from '@google-cloud/vision';

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

    // Use Google Cloud Vision API for landmark detection
    const credentials = process.env.GOOGLE_CLOUD_KEY
      ? JSON.parse(process.env.GOOGLE_CLOUD_KEY)
      : undefined;

    const client = new vision.ImageAnnotatorClient({
      credentials,
      projectId: credentials?.project_id,
    });
    const [result] = await client.landmarkDetection({ image: { content: buffer } });
    const landmarks = result.landmarkAnnotations || [];

    if (landmarks.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No landmark detected. Try a different image.",
        confidence: 0,
        recognition_details: {},
      });
    }

    // Use the top result
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
    });
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
