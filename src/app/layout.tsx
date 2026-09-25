import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multilingual QnA Generation System | English • Hindi • Marathi",
  description: "Intelligent AI system generating context-aware Question-Answer pairs in English, Hindi, and Marathi from PDF, DOCX, and TXT documents. Exports to Multilingual_QnA.xlsx with dedicated language sheets.",
  keywords: ["QnA Generator", "Multilingual NLP", "Hindi QnA", "Marathi QnA", "English QnA", "Excel Export", "Gemini AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen relative antialiased selection:bg-indigo-500/30 selection:text-indigo-200 bg-[#090d16] text-slate-100 font-sans">
        {/* Ambient Floating Glows */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="floating-glow-1 -top-32 -left-32 opacity-70" />
          <div className="floating-glow-2 top-1/3 -right-36 opacity-60" />
          <div className="floating-glow-3 -bottom-40 left-1/4 opacity-60" />
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        </div>

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
