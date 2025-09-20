import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Optional: Additional server-side sanitization
    const sanitizedFilename = file.name
      .replace(/\s+/g, '_')
      .replace(/[^\w\-_.]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const key = `uploads/${uuidv4()}-${sanitizedFilename}`;

    // Rest of your code remains the same
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: uint8Array,
      ContentType: file.type,
    });

    await r2.send(command);

    const fileUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${key}`;

    return NextResponse.json({ fileUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}