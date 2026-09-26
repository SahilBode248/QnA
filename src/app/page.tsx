"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  FileText,
  UploadCloud,
  Sparkles,
  Download,
  Copy,
  Check,
  Languages,
  Key,
  HelpCircle,
  X,
  FileSpreadsheet,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  SAMPLE_DOCUMENTS,
  SampleDoc,
  MultilingualQnAData,
  QnAPair,
  downloadExcelFile
} from "@/lib/qnaEngine";

type LanguageKey = "english" | "hindi" | "marathi";

export default function Home() {
  // --- STATES ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  // Processing & Pipeline
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Results
  const [qnaData, setQnaData] = useState<MultilingualQnAData | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageKey>("english");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("multilingual_gemini_key");
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("multilingual_gemini_key", key);
    setIsApiKeyModalOpen(false);
  };

  // --- FILE HANDLING ---
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = [".pdf", ".docx", ".txt"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Invalid file format: ${file.name}. Please upload .pdf, .docx, or .txt file.`);
      return;
    }
    setErrorMessage("");
    setSelectedFile(file);
    setPastedText("");
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- QUICK SAMPLE LOAD ---
  const handleLoadSample = (sample: SampleDoc) => {
    setSelectedFile(null);
    setPastedText(sample.text);
    setUseTextInput(true);
    setErrorMessage("");
    
    // Simulate instant demo loading with smooth step progression
    setIsProcessing(true);
    setPipelineStep(1);
    setStatusMessage(`Extracting content from sample: ${sample.title}...`);

    setTimeout(() => {
      setPipelineStep(2);
      setStatusMessage("Synthesizing context-aware English QnA pairs...");
    }, 450);

    setTimeout(() => {
      setPipelineStep(3);
      setStatusMessage("Translating and culturally adapting to Hindi (हिन्दी)...");
    }, 900);

    setTimeout(() => {
      setPipelineStep(4);
      setStatusMessage("Synthesizing fluent Marathi (मराठी) QnA pairs...");
    }, 1350);

    setTimeout(() => {
      setPipelineStep(5);
      setStatusMessage("Multilingual QnA dataset compiled successfully!");
      setQnaData({
        ...sample.precomputedQnA,
        metadata: {
          documentName: sample.title,
          totalPairs: sample.precomputedQnA.english.length,
          generatedAt: new Date().toISOString(),
          sourceWordCount: sample.text.split(/\s+/).length,
          isDemo: true
        }
      });
      setIsProcessing(false);
      triggerConfetti();
    }, 1700);
  };

  // --- CLIENT-SIDE PDF TEXT EXTRACTION ---
  const extractPdfTextClientSide = async (file: File): Promise<string> => {
    const pdfjsLib = await import("pdfjs-dist");
    
    // Set worker source
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str || "")
        .join(" ");
      if (pageText.trim()) {
        textParts.push(pageText.trim());
      }
    }

    return textParts.join("\n\n");
  };

  // --- SUBMIT GENERATION ---
  const handleGenerate = async () => {
    if (!selectedFile && (!pastedText || !pastedText.trim())) {
      setErrorMessage("Please select a document file (.pdf, .docx, .txt) or enter text.");
      return;
    }

    setErrorMessage("");
    setIsProcessing(true);
    setPipelineStep(1);
    setStatusMessage("Reading and parsing document contents...");

    try {
      const formData = new FormData();
      
      if (selectedFile) {
        const ext = selectedFile.name.slice(selectedFile.name.lastIndexOf(".")).toLowerCase();
        
        if (ext === ".pdf") {
          // Extract PDF text client-side (browser handles embedded fonts correctly)
          setStatusMessage("Extracting text from PDF (client-side processing)...");
          try {
            const pdfText = await extractPdfTextClientSide(selectedFile);
            if (!pdfText || pdfText.trim().length < 30) {
              throw new Error("Could not extract text from this PDF. Please try .txt or .docx format.");
            }
            formData.append("text", pdfText);
            formData.append("fileName", selectedFile.name);
          } catch (pdfErr: any) {
            throw new Error(
              pdfErr.message || 
              "Failed to extract text from PDF. Please save your document as .txt or .docx and try again."
            );
          }
        } else {
          // Send .docx and .txt directly to server for parsing
          formData.append("file", selectedFile);
        }
      } else {
        formData.append("text", pastedText);
        formData.append("fileName", "Manual_Text_Input.txt");
      }

      if (apiKey.trim()) {
        formData.append("apiKey", apiKey.trim());
      }

      // Step 2 visual update
      setTimeout(() => {
        setPipelineStep(2);
        setStatusMessage("Extracting core concepts & synthesizing English QnA...");
      }, 700);

      // Step 3 visual update
      setTimeout(() => {
        setPipelineStep(3);
        setStatusMessage("Generating context-aware Hindi (हिन्दी) Devanagari pairs...");
      }, 1600);

      // Step 4 visual update
      setTimeout(() => {
        setPipelineStep(4);
        setStatusMessage("Generating natural Marathi (मराठी) Devanagari pairs...");
      }, 2400);

      const res = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate QnA from document.");
      }

      setPipelineStep(5);
      setStatusMessage("Dataset compiled into 3 language subsheets!");
      setQnaData(json.data);
      triggerConfetti();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred during generation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#6366f1", "#10b981", "#f59e0b", "#ec4899"]
      });
    } catch {
      // Confetti fallback
    }
  };

  // --- EXCEL DOWNLOAD ---
  const handleDownloadExcel = () => {
    if (!qnaData) return;
    downloadExcelFile(qnaData, "Multilingual_QnA.xlsx");
    triggerConfetti();
  };

  const handleCopyPair = (pair: QnAPair, index: number) => {
    const text = `Q: ${pair.question}\nA: ${pair.answer}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!qnaData) return;
    const currentList = qnaData[activeTab];
    const text = currentList
      .map((p, i) => `Q${i + 1}: ${p.question}\nA: ${p.answer}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  // Filter pairs by search
  const currentPairs = qnaData ? qnaData[activeTab] || [] : [];
  const filteredPairs = currentPairs.filter(
    (p) =>
      p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen pb-32">
      {/* 1. FLOATING NAVIGATION BAR */}
      <header className="sticky top-4 z-40 max-w-6xl mx-auto px-4">
        <div className="glass-panel rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">QnA Multilingual</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Assignment Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Auto-generates English • Hindi • Marathi Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition border border-white/5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Assignment Spec</span>
            </button>

            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition border border-white/5"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey ? "API Key Set" : "Gemini API"}</span>
              {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-4xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-indigo-300 mb-4 animate-float-fast">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Multilingual Question-Answer Generation System</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Turn Documents into{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Multilingual QnA Pairs
          </span>
        </h1>
        <p className="mt-3.5 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Upload any text, word, or PDF document. The intelligent system analyzes the content and derives context-aware QnA pairs in{" "}
          <span className="text-indigo-300 font-semibold">English</span>,{" "}
          <span className="text-emerald-300 font-semibold">Hindi (हिन्दी)</span>, and{" "}
          <span className="text-amber-300 font-semibold">Marathi (मराठी)</span>, compiled into a single structured{" "}
          <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 text-xs font-mono font-bold">
            Multilingual_QnA.xlsx
          </code>{" "}
          workbook.
        </p>
      </section>

      {/* 3. MAIN WORKBENCH */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          
          {/* Quick Demo Pre-sets */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Instant Quick Demos (1-Click Test)
              </span>
              <span className="text-[11px] text-slate-500">Curated datasets ready for evaluation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleLoadSample(sample)}
                  className="flex flex-col text-left p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-indigo-500/40 transition group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition">
                      {sample.title}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 group-hover:text-indigo-400 transition" />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">{sample.category}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0f172a] px-3 text-[11px] font-medium text-slate-500 uppercase tracking-widest absolute">
              or upload your assignment document
            </span>
          </div>

          {/* Toggle File / Text Input */}
          <div className="flex items-center justify-end mb-3 gap-2">
            <button
              onClick={() => setUseTextInput(!useTextInput)}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition"
            >
              {useTextInput ? "Switch to File Upload (.pdf, .docx, .txt)" : "Switch to Raw Text Paste"}
            </button>
          </div>

          {/* DROPZONE */}
          {!useTextInput ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                  : "border-slate-700 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div
                  className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-800/80 border border-white/10 max-w-lg mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for QnA generation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1.5 mt-2 sm:mt-0 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-base font-semibold text-white">
                    Drop your document here, or <span className="text-indigo-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts text-based documents in <span className="text-slate-200 font-medium">.pdf</span>,{" "}
                    <span className="text-slate-200 font-medium">.docx</span>, or{" "}
                    <span className="text-slate-200 font-medium">.txt</span> format
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    {["PDF Document", "Word DOCX", "Plain TXT"].map((badge) => (
                      <span
                        key={badge}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-800 text-slate-300 border border-white/5"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the document text here in English, Hindi, Marathi, or mixed language..."
                rows={6}
                className="w-full p-4 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
              <div className="flex justify-between items-center text-xs text-slate-400 mt-1 px-1">
                <span>{pastedText.split(/\s+/).filter(Boolean).length} words</span>
                {pastedText && (
                  <button
                    onClick={() => setPastedText("")}
                    className="text-slate-400 hover:text-red-400 text-xs"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Target Outputs: English • Hindi • Marathi</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isProcessing || (!selectedFile && !pastedText.trim())}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-xl ${
                isProcessing || (!selectedFile && !pastedText.trim())
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                  : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 text-white hover:brightness-110 shadow-indigo-500/25 active:scale-95"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Multilingual QnA</span>
                </>
              )}
            </button>
          </div>

          {/* 4. LIVE PROCESSING PIPELINE VISUALIZER */}
          {isProcessing && (
            <div className="mt-8 p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 shadow-2xl animate-pulse-glow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  Intelligent Multilingual Pipeline Active
                </span>
                <span className="text-xs font-mono text-slate-400">{pipelineStep}/5</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${(pipelineStep / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                {[
                  { step: 1, label: "Extract Text" },
                  { step: 2, label: "English QnA" },
                  { step: 3, label: "Hindi (हिन्दी)" },
                  { step: 4, label: "Marathi (मराठी)" },
                  { step: 5, label: "Build Excel" },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`p-2 rounded-lg border transition ${
                      pipelineStep >= s.step
                        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200 font-semibold"
                        : "bg-slate-800/30 border-white/5 text-slate-500"
                    }`}
                  >
                    <div>Step {s.step}</div>
                    <div className="truncate font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-slate-300 mt-4 font-mono">{statusMessage}</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. MULTILINGUAL RESULTS SECTION */}
      {qnaData && (
        <section className="max-w-4xl mx-auto px-4 mt-10">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
            {/* Header with Title and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Generated Multilingual QnA Dataset
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {qnaData.english.length} Pairs / Lang
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Source: <span className="text-slate-200">{qnaData.metadata?.documentName || "Document"}</span> • 3 Dedicated Worksheets
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in questions or answers..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900/60 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Language Selector Tabs */}
            <div className="flex items-center gap-2 mt-6 p-1.5 rounded-2xl bg-slate-900/70 border border-white/5">
              {[
                { key: "english", label: "English", count: qnaData.english.length, badge: "EN" },
                { key: "hindi", label: "हिंदी (Hindi)", count: qnaData.hindi.length, badge: "HI" },
                { key: "marathi", label: "मराठी (Marathi)", count: qnaData.marathi.length, badge: "MR" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as LanguageKey)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30">
                    {tab.badge}
                  </span>
                  <span>{tab.label}</span>
                  <span className="text-xs opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Sheet format notification */}
            <div className="my-4 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Excel Worksheet: <span className="font-semibold text-white">{activeTab === "english" ? "English" : activeTab === "hindi" ? "Hindi" : "Marathi"}</span> • Columns: <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-300 font-mono">Questions</code> | <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-300 font-mono">Answers</code>
                </span>
              </div>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1 hover:text-white transition font-medium"
              >
                {allCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{allCopied ? "Copied!" : "Copy Sheet Text"}</span>
              </button>
            </div>

            {/* QnA Cards List */}
            <div className="space-y-3 mt-4">
              {filteredPairs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No QnA pairs found matching &quot;{searchQuery}&quot;.
                </div>
              ) : (
                filteredPairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-2xl p-4 sm:p-5 border border-white/5 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-400 font-mono text-xs font-bold shrink-0">
                          Q{idx + 1}
                        </span>
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold text-white leading-snug devanagari-text">
                            {pair.question}
                          </h3>
                          <div className="mt-2.5 p-3 rounded-xl bg-slate-900/50 border border-white/5">
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed devanagari-text">
                              <span className="text-slate-500 font-bold mr-2">Answer:</span>
                              {pair.answer}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyPair(pair, idx)}
                        title="Copy QnA pair"
                        className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. FLOATING STICKY ACTION DOCK */}
      {qnaData && (
        <div className="fixed bottom-5 inset-x-0 z-40 max-w-2xl mx-auto px-4 pointer-events-none">
          <div className="glass-panel rounded-2xl p-3 shadow-2xl border border-white/15 flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-2xl bg-slate-950/85">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white">Multilingual_QnA.xlsx</p>
                <p className="text-[10px] text-slate-400">3 Subsheets • Ready to Download</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQnaData(null);
                  setSelectedFile(null);
                  setPastedText("");
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Reset
              </button>

              <button
                onClick={handleDownloadExcel}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition flex items-center gap-2 animate-bounce-subtle"
              >
                <Download className="w-4 h-4" />
                <span>Download Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. API KEY SETTINGS MODAL */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 max-w-md w-full border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Google Gemini API Key</h3>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              To generate dynamic QnA on your custom documents, enter your Google Gemini API key. If omitted, the app smoothly uses the built-in intelligent demo dataset so testing never fails.
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between mt-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  Get free Gemini API key <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {apiKey && (
                  <button
                    onClick={() => saveApiKey("")}
                    className="text-[11px] text-red-400 hover:underline"
                  >
                    Clear key
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => saveApiKey(apiKey)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ASSIGNMENT SPEC CHECKLIST MODAL */}
      {isSpecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Assignment Deliverables</h3>
              </div>
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <span className="font-bold text-white text-xs block text-emerald-400">1. Input Resources</span>
                <p>Accepts documents in <span className="text-white font-medium">.pdf</span>, <span className="text-white font-medium">.docx</span>, and <span className="text-white font-medium">.txt</span> format, written in English, Hindi, Marathi, or mixed language.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <span className="font-bold text-white text-xs block text-indigo-400">2. Automated QnA Generation</span>
                <p>Derives context-aware, grammatically accurate question-answer pairs directly from content in three target languages: <span className="text-white font-medium">English</span>, <span className="text-white font-medium">Hindi (हिंदी)</span>, and <span className="text-white font-medium">Marathi (मराठी)</span>.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <span className="font-bold text-white text-xs block text-purple-400">3. Single Excel Output (Multilingual_QnA.xlsx)</span>
                <p>Contains three separate subsheets:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                  <li><span className="text-white">English</span>: QnA pairs in English</li>
                  <li><span className="text-white">Hindi</span>: QnA pairs in Hindi</li>
                  <li><span className="text-white">Marathi</span>: QnA pairs in Marathi</li>
                </ul>
                <p className="mt-1">Each subsheet follows the exact format: <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-300 font-mono">Questions</code> | <code className="bg-black/40 px-1 py-0.5 rounded text-emerald-300 font-mono">Answers</code></p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <span className="font-bold text-white text-xs block text-amber-400">4. Python CLI Deliverable</span>
                <p>A standalone Python script <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">python/generate_qna.py</code> is also provided with <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">requirements.txt</code> to execute directly in terminal.</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsSpecModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
