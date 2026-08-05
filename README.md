# CODELYNX AI

> **"Understand Your Code. Improve Your Thinking."**  
> A Premium AI-Powered Coding, Multi-Language Compilation, Debugging & Asymptotic Complexity Analysis Platform.

---

## 1. Overview

**CODELYNX AI** is an enterprise-grade full-stack developer workspace. It brings together the functionality of a professional code editor, isolated sandboxed compilation, AI-guided vulnerability and bug detection, asymptotic Big-O complexity analysis, algorithmic optimization, automated edge-case test generation, and multi-file project persistence.

Built from the ground up with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Monaco Editor**, and **MongoDB/Mongoose**, CODELYNX AI bridges the gap between raw code execution and high-level algorithmic cognition.

---

## 2. Core Feature Pillars

### 💻 1. The Main Coding Workspace (`/workspace`)
- **Full Monaco Editor Integration:** Syntax highlighting, bracket-pair colorization, line numbers, customizable font sizes, minimap toggle, word-wrap, and format document.
- **10 First-Class Languages Supported:** Python 3, C++ (GCC), JavaScript (Node.js), TypeScript, Java (OpenJDK), C (GCC), C# (Mono/.NET), Go, Rust, and SQL.
- **Multi-File Workspace:** Add files, rename, duplicate, delete with confirmation, and download source files.
- **Active State Tracking:** Real-time dirty-state indicator prevents loss of unsaved changes.
- **Modern Command Palette (`Ctrl+K` / `Cmd+K`):** Quick-launch any compiler, AI, or navigation action via keyboard.

### ⚡ 2. Isolated Code Compiler & Telemetry (`/api/executions`)
- **Sandboxed Execution Provider:** Compatible with Judge0 CE / RapidAPI or private self-hosted Judge0 instances.
- **Local Sandbox Simulator:** Operates seamlessly offline with static AST verification, syntax checking, and safe execution simulation when external credentials are not supplied.
- **Standard Output & Diagnostics:** Distinct tabs for stdout, compiler warnings, stderr, custom stdin inputs, and runtime telemetry.
- **Execution Metrics:** Live measurement of wall-clock runtime (ms), peak memory consumption (KB), and exit status.

### 🐞 3. AI Code Debugger & Signature "Find Mistakes" (`/api/ai/debug`)
- **Multi-Class Defect Classification:** Identifies syntax errors, runtime bugs, buffer overruns, unclosed pointers, logic inversions, and performance bottlenecks.
- **Concrete Line Markers & Demonstration Cases:** Identifies exact lines where errors originate and generates test vectors reproducing the failure.
- **Zero-Overwrite Diff Reviewer:** When you click **Fix Code**, CODELYNX AI renders a git-style side-by-side diff highlighting additions (`+` green) and deletions (`-` red). Changes are only applied upon explicit developer approval.

### 📈 4. Complexity Lab & Empirical Benchmarking (`/api/analysis/complexity`)
- **Mathematical Big-O Derivations:** Calculates worst-case, average-case, and best-case asymptotic time complexity alongside auxiliary space complexity.
- **Recurrence Relations & Dominant Operations:** Explains recursive call tree bounds and inner nested loop counts.
- **Empirical Benchmark Runner:** Executes algorithms against 5 scaling data sizes ($n=100$ to $n=10,000$) and visualizes measured runtime curves using Recharts.
- **Scientific Integrity:** Explicitly differentiates between formal asymptotic mathematical bounds and empirical hardware measurements.

### 🚀 5. Algorithmic Code Optimizer (`/api/ai/optimize`)
- Converts brute-force quadratic $O(n^2)$ algorithms into linear $O(n)$ hash tables or two-pointer patterns.
- Profiles memory allocations, eliminates redundant calculations, and applies language-specific best practices.

### 🧪 6. Test Suite Generator & Runner (`/api/ai/generate-tests`)
- Generates comprehensive test matrices: normal cases, boundary values, empty inputs, duplicate elements, negative numbers, and adversarial inputs.
- Runs individual or bulk test vectors, comparing actual execution output with expected results.

### 📂 7. Developer Dashboard & Telemetry History (`/dashboard`, `/history`, `/projects`)
- **Dashboard:** Activity logs, language usage distribution, recent projects, and quick-launch shortcuts.
- **Execution History:** Searchable execution log with language and status filters, exit codes, and re-run capabilities.
- **Settings:** Editor appearance, light/dark theme toggle, Gemini model selection, and zero-retention privacy controls.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript (Strict Mode), Tailwind CSS, Monaco Editor, Lucide Icons, Recharts, Diff |
| **Backend** | Next.js Server Route Handlers, Zod Validation, Jose (JWT), BcryptJS |
| **Execution** | Judge0 CE Provider Adapter + Local Sandbox Simulator |
| **AI Intelligence** | Google Gemini Developer API (`@google/generative-ai`), Configurable Model (`gemini-2.5-flash`), Deterministic AST Fallback Engine |
| **Database** | MongoDB Atlas, Mongoose ODM (with graceful in-memory development store) |
| **Testing** | Node.js Test Runner, TSX, Zod Validation Tests |

---

## 4. Local Installation & Setup

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v24.14.1`)
- npm, pnpm, or yarn

### 1. Clone the repository and install dependencies
```bash
git clone <repository_url> codelynx-ai
cd codelynx-ai
npm install
```

### 2. Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Edit `.env.local` to configure your preferred external services (all external services are optional for initial development):

```env
# APPLICATION
APP_URL=http://localhost:3000
AUTH_SECRET=your-32-char-secret-key-here

# DATABASE (MongoDB Atlas - Optional in dev)
# If left blank, CodeLynx operates in local development session mode.
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=codelynx

# AI SERVICES (Google Gemini - Optional in dev)
# If left blank, CodeLynx activates its deterministic heuristic analysis engine.
GEMINI_API_KEY=
GEMINI_API_MODEL=gemini-2.5-flash

# REMOTE EXECUTION (Judge0 CE - Optional in dev)
# If left blank, CodeLynx activates its safe local sandbox simulator.
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Fast Demo Account
To quickly test authenticated features without database setup, use the pre-configured Staff Engineer account:
- **Email:** `demo@codelynx.ai`
- **Password:** `Password123!`
- Or simply click **"One-Click Demo Developer Login"** on the `/login` page.

---

## 5. Automated Testing

Run the full unit test suite:
```bash
npm test
```

The test suite covers:
1. **Deterministic Complexity Engine:** Verifies $O(1)$, $O(\log n)$, $O(n)$, $O(n \log n)$, $O(n^2)$, and recursion classification.
2. **AI Response Schema Validation:** Validates strict Zod schemas for bugs, fixes, complexity reports, optimizations, and test vectors.
3. **Execution Engine:** Verifies language registry, syntax error trapping, and sandbox output parsing.

---

## 6. Production Build

To verify and generate an optimized production bundle:
```bash
npm run build
npm run start
```

---

## 7. Keyboard Shortcuts Guide

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Ctrl + Enter` / `Cmd + Enter` | Run Code in Isolated Sandbox | Workspace |
| `Ctrl + K` / `Cmd + K` | Open Developer Command Palette | Global |
| `Ctrl + S` / `Cmd + S` | Save Current Project State | Workspace |
| `Ctrl + Shift + D` | Run AI Debugger ("Find Mistakes") | Workspace |
| `Ctrl + Shift + C` | Open Complexity Analysis Lab | Workspace |
| `Ctrl + Shift + O` | Trigger Code Optimizer | Workspace |

---

## 8. Security Architecture & Privacy Disclosure

- **No Server-Side Eval:** User code is never executed via Node.js `eval()`, `child_process`, or direct host execution on the Next.js application server.
- **Isolated Containers:** Code executions run through isolated Judge0 sandboxes or client-safe static analyzers.
- **Zero-Overwrite Principle:** The AI is strictly prohibited from overwriting user code without manual diff approval.
- **Ephemeral Processing:** Code snippets submitted for analysis are not stored or used for model training.

---

## 9. License

This project is licensed under the MIT License — see the LICENSE file for details.
