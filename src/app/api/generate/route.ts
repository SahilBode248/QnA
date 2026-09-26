import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import {
  generateQnAWithGemini,
  generateContextualQnA,
  generateExcelBuffer,
  SAMPLE_DOCUMENTS,
  MultilingualQnAData
} from "@/lib/qnaEngine";

function cleanPdfText(text: string): string {
  if (!text) return "";
  
  // 1. Remove font table keywords, CID codes, and kerning offsets
  let cleaned = text
    .replace(/<[0-9A-Fa-f]{2,}>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/-\d+\s*/g, " ")
    .replace(/\b(Adobe|UCS|glyf|glyfr|fpgm|hmtx|head|loca|maxp|CFF|cmap|FontDescriptor|ToUnicode|en-IN|FontName|BaseFont|CIDInit|ProcSet|Encoding)\b/gi, " ")
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ");

  // 2. Filter words to keep only valid human-readable words (with letters)
  const words = cleaned.split(/\s+/).filter(w => {
    const letterCount = (w.match(/[a-zA-Z]/g) || []).length;
    const symbolCount = w.length - letterCount;
    return letterCount >= 2 && symbolCount <= 2 && !w.startsWith("/");
  });

  const result = words.join(" ").trim();
  
  // Must contain at least 12 real words to be valid text
  if (words.length < 12) {
    return "";
  }

  return result;
}

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
    let rawResult = "";
    try {
      let pdfFunc: any = null;
      try {
        const pdfModule = await import("pdf-parse");
        pdfFunc = (pdfModule as any).default || pdfModule;
      } catch {
        const req = eval("require");
        pdfFunc = req("pdf-parse");
      }

      if (typeof pdfFunc === "function") {
        const data = await pdfFunc(buffer);
        if (data && data.text && data.text.trim()) {
          rawResult = data.text.trim();
        }
      }
    } catch (e: any) {
      console.warn("PDF parse primary notice:", e?.message);
    }

    const cleanedPrimary = cleanPdfText(rawResult);
    if (cleanedPrimary) {
      return cleanedPrimary;
    }

    // Stream text & FlateDecode extraction fallback
    try {
      const zlib = require("zlib");
      const rawStr = buffer.toString("latin1");
      const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      let extracted = "";
      let match: RegExpExecArray | null;

      while ((match = streamRegex.exec(rawStr)) !== null) {
        const streamData = Buffer.from(match[1], "latin1");
        let decompressed: Buffer = streamData;
        try {
          decompressed = zlib.inflateSync(streamData);
        } catch {
          try {
            decompressed = zlib.unzipSync(streamData);
          } catch {
            // Keep raw stream
          }
        }

        const textContent = decompressed.toString("latin1");
        const tjMatches = textContent.match(/\(([^)]+)\)/g);
        if (tjMatches) {
          for (const m of tjMatches) {
            const str = m.replace(/[()]/g, "");
            if (str.trim().length > 1 && !str.includes("\\") && /[a-zA-Z]{2,}/.test(str)) {
              extracted += str + " ";
            }
          }
        }
      }

      const cleanedStream = cleanPdfText(extracted);
      if (cleanedStream) {
        return cleanedStream;
      }
    } catch (e: any) {
      console.warn("Stream extraction notice:", e?.message);
    }

    // Ultimate fallback: extract readable words from buffer
    const asciiText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    const words = asciiText.match(/[A-Za-z]{2,}/g) || [];
    const filteredText = words.filter(w => !w.startsWith("obj") && !w.startsWith("endobj") && !w.startsWith("stream")).join(" ");

    const cleanedAscii = cleanPdfText(filteredText);
    if (cleanedAscii) {
      return cleanedAscii;
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
