# Multilingual Question-Answer (QnA) Generation System

An intelligent, production-ready system that automatically generates meaningful, accurate, and context-aware Question-Answer (QnA) pairs from any input document and outputs results in three target languages: **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.

The system compiles results into a single Excel workbook named **`Multilingual_QnA.xlsx`** containing three dedicated worksheets (`English`, `Hindi`, `Marathi`) with columns **`Questions`** and **`Answers`**.

---

## 🌟 Key Features & UI/UX Highlights

- **Floating Website Aesthetics**:
  - Dynamic ambient glowing background orbs with floating animations.
  - Modern glassmorphism cards (`backdrop-blur-xl`, border glow, smooth shadows).
  - Floating pill header with live status chip and assignment spec modal.
  - Floating interactive drag-and-drop document dropzone.
  - Sticky bottom floating action dock with 1-click Excel download button.
- **Multilingual Support**:
  - Automatically derives QnA pairs in **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
  - Full Devanagari script typography with proper line-height and matra rendering.
- **Accepted File Formats**:
  - Text-based `.pdf` (Portable Document Format)
  - `.docx` (Microsoft Word Document)
  - `.txt` (Plain Text File)
- **Exact Assignment Excel Deliverable**:
  - Produces `Multilingual_QnA.xlsx` (or `QnA.xlsx`).
  - Exactly three subsheets: `English`, `Hindi`, `Marathi`.
  - Format in each sheet: `Questions` | `Answers`.
  - Auto-adjusted column widths and clean headers.
- **Zero-Failure Demo Mode & Custom Key Drawer**:
  - Pre-bundled 1-click curated datasets (Space Exploration, AI Healthcare, Indian Constitution) for instant evaluation without an API key.
  - Floating drawer to enter a custom Google Gemini API key if desired.
- **Standalone Python Deliverable Included**:
  - Complete CLI script in `python/generate_qna.py` capable of processing `.pdf`, `.docx`, and `.txt` files directly.

---

## 📁 Streamlined File Structure

```
├── src/
│   ├── app/
│   │   ├── api/generate/route.ts   # Unified API for document parsing & multilingual synthesis
│   │   ├── globals.css             # Floating animations, glassmorphism & typography
│   │   ├── layout.tsx              # Root layout & ambient glows
│   │   └── page.tsx                # Master floating UI (dropzone, preview tabs, sticky dock)
│   └── lib/
│       └── qnaEngine.ts            # Core engine (types, Gemini API, SheetJS Excel builder, sample datasets)
├── python/
│   ├── generate_qna.py             # Assignment Python Code deliverable (CLI)
│   └── requirements.txt            # Python dependencies (openpyxl, pypdf, python-docx, pandas)
├── sample_docs/                    # Ready-to-test sample files (.txt, .docx)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── vercel.json
└── README.md
```

---

## 🚀 Deployment to Vercel

### Option 1: Deploy with Vercel CLI (Fastest)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. In the project directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to deploy directly.
4. (Optional) Set `GEMINI_API_KEY` in your Vercel Project Settings under **Environment Variables**.

### Option 2: Deploy via GitHub & Vercel Dashboard

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: Multilingual QnA Generation System"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set Framework Preset to **Next.js**.
5. (Optional) Add Environment Variable:
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
6. Click **Deploy**!

---

## 💻 Local Development

### 1. Web Application (Next.js)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or build and start production server
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Standalone Python CLI (`python/generate_qna.py`)

The project includes the Python code deliverable required by the assignment:

```bash
# Install Python dependencies
pip install -r python/requirements.txt

# Run with built-in sample text:
python python/generate_qna.py --sample

# Run with an input file (.pdf, .docx, or .txt):
python python/generate_qna.py -i sample_docs/healthcare_ai.docx -o Multilingual_QnA.xlsx

# Run with a custom Gemini API key:
python python/generate_qna.py -i sample_docs/healthcare_ai.docx -k YOUR_API_KEY
```

This generates `Multilingual_QnA.xlsx` with three sheets:
- `English`
- `Hindi`
- `Marathi`
Each sheet with columns `Questions` and `Answers`.

---

## 📋 Assignment Deliverables Checklist

| Requirement | Status | Details |
|---|:---:|---|
| Accepts `.pdf`, `.docx`, `.txt` | ✅ Complete | Both Web App & Python CLI parse all 3 formats |
| Handles English / Multilingual inputs | ✅ Complete | Dynamic text extraction and language processing |
| Generates context-aware QnA pairs | ✅ Complete | English, Hindi (हिन्दी), Marathi (मराठी) |
| Output Excel file `Multilingual_QnA.xlsx` | ✅ Complete | Single workbook with 3 subsheets (`English`, `Hindi`, `Marathi`) |
| Excel Sheet Format: `Questions` \| `Answers` | ✅ Complete | Exact headers in all 3 subsheets |
| Standalone Python Code | ✅ Complete | `python/generate_qna.py` + `python/requirements.txt` |
| Floating Website with Good UI/UX | ✅ Complete | Glassmorphism, floating glows, interactive preview tabs & sticky dock |
| Deployable on Vercel | ✅ Complete | Next.js App Router, serverless safe, zero build errors |
