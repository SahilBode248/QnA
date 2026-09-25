import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import {
  generateQnAWithGemini,
  generateContextualQnA,
  generateExcelBuffer,
  SAMPLE_DOCUMENTS,
  MultilingualQnAData
} from "@/lib/qnaEngine";

async function parseDocument(fileBuffer: Buffer | ArrayBuffer, fileName: string): Promise<string> {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);

  if (ext === ".txt") {
    return buffer.toString("utf-8");
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (ext === ".pdf") {
    try {
      const pdfModule = await import("pdf-parse");
      if ((pdfModule as any).PDFParse) {
        const parser = new (pdfModule as any).PDFParse({ data: buffer });
        await parser.load();
        const res = await parser.getText();
        if (res && res.trim()) return res.trim();
      } else if (typeof (pdfModule as any).default === "function") {
        const data = await (pdfModule as any).default(buffer);
        if (data && data.text && data.text.trim()) return data.text.trim();
      }
    } catch (e: any) {
      console.warn("PDF parser notice:", e?.message);
    }

    // Fallback stream text extraction
    const raw = buffer.toString("latin1");
    const matches = raw.match(/\(([^)]+)\)\s*Tj/g);
    if (matches && matches.length > 5) {
      return matches.map(m => m.replace(/[()]/g, "").replace(/\s*Tj$/, "")).join(" ");
    }
    throw new Error("Could not extract readable text from PDF. Please verify the PDF contains selectable text.");
  }

  throw new Error(`Unsupported file type: ${ext}. Supported formats: .pdf, .docx, .txt`);
}

export const maxDuration = 60; // 60 seconds serverless timeout on Vercel
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let extractedText = "";
    let fileName = "document.txt";
    let apiKey = process.env.GEMINI_API_KEY || "";
    let sampleId = "";
    let returnExcel = req.nextUrl.searchParams.get("format") === "excel";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const customKey = formData.get("apiKey") as string | null;
      const requestedSample = formData.get("sampleId") as string | null;
      const fmt = formData.get("format") as string | null;

      if (customKey && customKey.trim()) {
        apiKey = customKey.trim();
      }
      if (requestedSample) {
        sampleId = requestedSample;
      }
      if (fmt === "excel") {
        returnExcel = true;
      }

      if (file && file.size > 0) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        extractedText = await parseDocument(Buffer.from(arrayBuffer), fileName);
      }
    } else {
      const body = await req.json();
      if (body.apiKey && body.apiKey.trim()) {
        apiKey = body.apiKey.trim();
      }
      if (body.sampleId) {
        sampleId = body.sampleId;
      }
      if (body.text) {
        extractedText = body.text;
      }
      if (body.fileName) {
        fileName = body.fileName;
      }
      if (body.format === "excel") {
        returnExcel = true;
      }
    }

    // Check if sample requested directly
    if (sampleId) {
      const sample = SAMPLE_DOCUMENTS.find(s => s.id === sampleId);
      if (sample) {
        if (returnExcel) {
          const buffer = generateExcelBuffer(sample.precomputedQnA);
          return new Response(Buffer.from(buffer), {
            headers: {
              "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              "Content-Disposition": 'attachment; filename="Multilingual_QnA.xlsx"'
            }
          });
        }
        return NextResponse.json({
          success: true,
          data: {
            ...sample.precomputedQnA,
            metadata: {
              documentName: sample.title,
              totalPairs: sample.precomputedQnA.english.length,
              generatedAt: new Date().toISOString(),
              sourceWordCount: sample.text.split(/\s+/).length,
              isDemo: true
            }
          }
        });
      }
    }

    if (!extractedText || !extractedText.trim()) {
      return NextResponse.json(
        { success: false, error: "No text or document provided to generate QnA from." },
        { status: 400 }
      );
    }

    let qnaResult: MultilingualQnAData;

    if (apiKey) {
      try {
        qnaResult = await generateQnAWithGemini(extractedText, apiKey, fileName);
      } catch (geminiError: any) {
        console.warn("Gemini call failed, falling back to contextual generator:", geminiError?.message);
        qnaResult = generateContextualQnA(extractedText, fileName);
      }
    } else {
      qnaResult = generateContextualQnA(extractedText, fileName);
    }

    if (returnExcel) {
      const buffer = generateExcelBuffer(qnaResult);
      return new Response(Buffer.from(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="Multilingual_QnA.xlsx"'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: qnaResult
    });

  } catch (error: any) {
    console.error("API error in /api/generate:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process document and generate QnA." },
      { status: 500 }
    );
  }
}
