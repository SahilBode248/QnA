import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import {
  generateQnAWithGemini,
  generateContextualQnA,
  generateExcelBuffer,
  SAMPLE_DOCUMENTS,
  MultilingualQnAData
} from "@/lib/qnaEngine";

// Common English words used to validate extracted text is real (not font binary data)
const COMMON_WORDS = new Set([
  "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with",
  "he","as","you","do","at","this","but","his","by","from","they","we","her","she","or",
  "an","will","my","one","all","would","there","their","what","so","up","out","if","about",
  "who","get","which","go","me","when","make","can","like","time","no","just","him","know",
  "take","people","into","year","your","good","some","could","them","see","other","than",
  "then","now","look","only","come","its","over","think","also","back","after","use","two",
  "how","our","work","first","well","way","even","new","want","because","any","these","give",
  "day","most","us","is","are","was","were","been","has","had","did","does","said","each",
  "may","between","should","before","those","same","much","where","very","after","many",
  "through","such","world","system","used","using","based","data","information","technology",
  "intelligence","artificial","learning","machine","health","healthcare","medical","digital",
  "modern","important","process","application","analysis","research","development","education",
  "students","teachers","devices","services","including","questions","answers","document",
  "life","human","computer","understanding","challenges","systems","support","provide",
  "example","different","called","help","language","natural","processing","model","deep",
  "every","more","still","here","must","need","part","great","high","small","large","end",
  "long","both","while","found","head","made","right","still","since","during","without",
  "however","under","another","being","once","down","upon","already","among","might","own",
  "say","number","water","point","set","next","order","against","place","three","around",
  "where","several","however","until","along","always","rather","often","never","person",
  "india","indian","english","hindi","marathi","question","answer","text","file","word",
  "smartphone","smartphones","bank","banking","shopping","transportation","entertainment",
  "communication","recommendation","privacy","security","cybersecurity","bias","efficiency",
  "automation","personalized","responsible","ethical","judgment","experience","professional",
  "introduction","conclusion","benefits","format","input","output","sample","print","result"
]);

function isValidExtractedText(text: string): boolean {
  if (!text || text.trim().length < 50) return false;
  
  // Strip non-ASCII and normalize
  const ascii = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
  const words = ascii.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  
  if (words.length < 15) return false;
  
  // Count how many words are common English words
  let commonCount = 0;
  for (const w of words) {
    if (COMMON_WORDS.has(w)) commonCount++;
  }
  
  const ratio = commonCount / words.length;
  // Real English text typically has >20% common words; font binary data has <5%
  return ratio > 0.15;
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
    // Attempt 1: Use pdf-parse library
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
        if (data && data.text) {
          rawResult = data.text.trim();
        }
      }
    } catch (e: any) {
      console.warn("PDF parse notice:", e?.message);
    }

    // Validate: is this real text or font binary garbage?
    if (rawResult && isValidExtractedText(rawResult)) {
      return rawResult;
    }

    // Attempt 2: Stream text extraction with FlateDecode decompression
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
            continue;
          }
        }

        const textContent = decompressed.toString("latin1");
        const tjMatches = textContent.match(/\(([^)]+)\)/g);
        if (tjMatches) {
          for (const m of tjMatches) {
            const str = m.replace(/[()]/g, "");
            if (str.trim().length > 1 && /[a-zA-Z]{2,}/.test(str)) {
              extracted += str + " ";
            }
          }
        }
      }

      if (extracted && isValidExtractedText(extracted)) {
        return extracted.trim();
      }
    } catch (e: any) {
      console.warn("Stream extraction notice:", e?.message);
    }

    // All extraction methods failed to produce valid text
    throw new Error(
      "This PDF uses embedded fonts that prevent text extraction. " +
      "Please save your document as a .txt or .docx file and upload again. " +
      "Tip: Open the PDF, select all text (Ctrl+A), copy it (Ctrl+C), " +
      "paste into Notepad, and save as .txt file."
    );
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
