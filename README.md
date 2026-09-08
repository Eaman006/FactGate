# FactGate 🛡️
> **Evidence-Grounded Multi-Tenant Knowledge Layer & Fact Verification System**

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Flask](https://img.shields.io/badge/Flask_3.1-000000?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)

---

## 📌 Overview & Problem Statement

Modern enterprise document analysis relying on Generative AI models suffers from **hallucinations, untraceable facts, and conflicting claims** across large corpora. Traditional RAG (Retrieval-Augmented Generation) systems return broad text chunks without strict fact-level verification, leaving analysts unable to verify numerical or semantic claims quickly.

**FactGate** solves this problem by acting as an **evidence-grounded fact extraction and verification knowledge layer**. It automatically ingests complex multi-page PDF documents, extracts atomic facts, evaluates cross-document relationship matrices, and grounds every extracted claim directly back to **verbatim source quotes and page numbers**.

---

## ✨ Key Features

- 🔐 **Multi-Tenant User Isolation & Firebase Auth**: Secure Google Single Sign-On (SSO) with complete per-user database and state isolation (`user_id` scoping across all DB tables and `localStorage`).
- 📄 **Automated PDF Ingestion & Parsing Pipeline**: Ingests multi-page financial reports, legal contracts, and technical specifications, extracting text per page and storing raw text structures.
- ⚖️ **Fact Verification & Relationship Matrices**: Classifies cross-document relationships into four strict categories:
  - 🟢 `Corroborated`: Multiple sources support the claim.
  - 🔴 `Contradicted`: Sources materially disagree without explanation.
  - 🔵 `Context Resolved`: Disagreements explained by period, scope, units, or geography.
  - 🟡 `Needs Review`: Low confidence or ambiguous claims flagged for manual analyst review.
- 🎯 **Direct Page-Jump Evidence Viewer**: Built-in interactive document previewer allowing analysts to verify quotes instantly with direct page targeting.
- 📂 **Workspace & Corpus Management**: Create, rename, delete, and persist custom isolated workspaces (`Acme Corp`, `Personal Workspace`, etc.) stored dynamically per user.
- 🔍 **Interactive Command Palette & Smart Filtering**: Quick search modal (`Cmd+K` / `Ctrl+K`) for global entity, document, and fact lookups with real-time status filtering.

---

## 🏗️ System Architecture & Tech Stack

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                                │
│   Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui    │
│   Firebase Client Auth (Google SSO) + Framer Motion + Lucide Icons       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  HTTPS / JSON API (Bearer Token)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Render)                                 │
│   Python Flask 3.1 + PyPDF Extraction Engine + Google Gemini AI         │
│   SQLite Database (Fact & Document Index) + Flask-CORS Middleware       │
└─────────────────────────────────────────────────────────────────────────┘
```

### 💻 Technology Breakdown

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 16` (App Router) | Client-side dashboard, SSR, and dynamic layout routing |
| **Styling & UI** | `Tailwind CSS v4`, `shadcn/ui` | Dark-mode glassmorphism design system & components |
| **State & Motion** | `React Hooks`, `Framer Motion` | Micro-animations, dynamic loading, & workspace persistence |
| **Authentication** | `Firebase Authentication` | Secure Google OAuth 2.0 user sessions |
| **Backend Framework**| `Python 3.10+`, `Flask 3.1` | REST API routes, auth verification, CORS handling |
| **PDF Extraction** | `PyPDF` | Page-by-page text parsing and quote indexing |
| **AI Verification** | `Google Gemini API` | Fact extraction, reasoning, and relationship consolidation |
| **Database** | `SQLite3` | Light-weight indexed persistence for documents and facts |
| **Deployment** | `Vercel` (FE) + `Render` (BE) | Global edge hosting & automated CI/CD deployment pipelines |

---

## 🚀 Getting Started / Local Installation Guide

Follow these step-by-step instructions to run both the backend and frontend services on your local machine.

### 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher
- **pnpm**: `v9.0.0` or higher (or `npm`)
- **Python**: `v3.10` or higher

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Eaman006/FactGate.git
cd FactGate
```

---

### 2️⃣ Backend Setup (Flask)

1. Open a terminal and navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file inside `Backend/` (refer to `.env.example`):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   PORT=5000
   ```

5. Start the Flask backend server:
   ```bash
   python app.py
   ```
   > The backend server will run on **`http://localhost:5000`** and auto-create the SQLite database (`factgate.db`).

---

### 3️⃣ Frontend Setup (Next.js)

1. Open a second terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```

2. Create a `.env.local` file inside `Frontend/` (refer to `.env.local.example`):
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

   # Firebase Auth Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. Install Node dependencies:
   ```bash
   pnpm install
   # or: npm install
   ```

4. Start the Next.js dev server:
   ```bash
   pnpm dev
   # or: npm run dev
   ```
   > The web app will open at **`http://localhost:3000`**.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Server health check & status diagnosis | ❌ No |
| `POST` | `/upload` | Ingests PDF files (`multipart/form-data`) and extracts candidate facts | 🔐 Yes (Bearer Token) |
| `GET` | `/facts` | Retrieves extracted facts filtered by workspace/user | 🔐 Yes (Bearer Token) |
| `GET` | `/documents` | Lists all processed documents with metadata and page counts | 🔐 Yes (Bearer Token) |
| `DELETE` | `/documents/<name>` | Deletes a document, pages, and linked facts from corpus | 🔐 Yes (Bearer Token) |
| `GET` | `/uploads/<filename>`| Serves processed raw PDF file for inline browser viewing | ❌ No |

---

## 👤 Author

Crafted with precision by **[Md Eaman Adeep](https://github.com/Eaman006)**.

---

<p center="text-center">
  <sub>Built for precision document analysis & evidence verification. © 2026 FactGate.</sub>
</p>
