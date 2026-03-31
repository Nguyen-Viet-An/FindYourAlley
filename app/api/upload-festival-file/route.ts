import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { promises as fs } from "fs";
import path from "path";

const ADMIN_USER_ID = "67db65cdd14104a0c014576d";

const ALLOWED_EXTENSIONS = [".json", ".xml"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    // Admin check
    const { sessionClaims } = await auth();
    const userId = sessionClaims?.userId as string;
    if (userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    // Validate extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Sanitize filename: only allow alphanumeric, dash, underscore, dot, space
    const baseName = path.basename(file.name);
    const sanitized = baseName.replace(/[^a-zA-Z0-9\-_. ]/g, "_");
    if (!sanitized || sanitized.startsWith(".")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Validate JSON files are valid JSON
    const content = await file.text();
    if (ext === ".json") {
      try {
        JSON.parse(content);
      } catch {
        return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
      }
    }

    // Write to data/ directory in project root
    const dataDir = path.join(process.cwd(), "data");
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, sanitized);
    await fs.writeFile(filePath, content, "utf-8");

    // Return the relative path (what gets stored in festival.boothFile etc.)
    const relativePath = `data/${sanitized}`;

    return NextResponse.json({ filePath: relativePath, fileName: sanitized });
  } catch (err) {
    console.error("Festival file upload error:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
