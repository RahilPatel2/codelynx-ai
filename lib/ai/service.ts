import { GeminiProvider } from "./gemini";
import { DeterministicCodeAnalyzer } from "./heuristics";
import {
  DebugAnalysisResult,
  DebugAnalysisResultSchema,
  ComplexityAnalysisResult,
  ComplexityAnalysisResultSchema,
  OptimizationResult,
  OptimizationResultSchema,
  TestSuiteResult,
  TestSuiteResultSchema,
  FixCodeResult,
  FixCodeResultSchema,
  ExplainCodeResult,
  ExplainCodeResultSchema,
  CodeReviewResult,
  CodeReviewResultSchema,
  ErrorExplanationResult,
  ErrorExplanationResultSchema,
  DocumentationResult,
  DocumentationResultSchema,
} from "./types";

export interface AIServiceStatus {
  isConfigured: boolean;
  provider: "gemini" | "deterministic-fallback";
  modelName: string;
}

export interface AIOptions {
  model?: string;
  detailLevel?: "concise" | "balanced" | "detailed" | "step-by-step";
}

export function formatDetailInstruction(detailLevel?: string): string {
  switch (detailLevel) {
    case "concise":
      return "\n[Style Instruction: Provide concise answers. Bullet points and precise code diffs only, no filler prose.]";
    case "detailed":
      return "\n[Style Instruction: Provide deep, comprehensive analysis including algorithmic derivations, memory layout, and full edge-case walkthrough.]";
    case "step-by-step":
      return "\n[Style Instruction: Structure your response into numbered chronological steps (Step 1, Step 2...) guiding the developer.]";
    case "balanced":
    default:
      return "\n[Style Instruction: Provide balanced, clear engineering explanations with rationale and practical code solutions.]";
  }
}

export class AIService {
  private gemini = new GeminiProvider();
  private fallback = new DeterministicCodeAnalyzer();

  getStatus(): AIServiceStatus {
    const isConfigured = this.gemini.isConfigured();
    return {
      isConfigured,
      provider: isConfigured ? "gemini" : "deterministic-fallback",
      modelName: isConfigured ? this.gemini.getModelName() : "offline-heuristics",
    };
  }

  async findMistakes(
    code: string,
    language: string,
    runtimeError?: string,
    options?: AIOptions
  ): Promise<DebugAnalysisResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Analyze this ${language} code for bugs, errors, security vulnerabilities, edge cases, and performance bottlenecks.${detail}
Return a JSON object conforming strictly to this structure:
{
  "overallSummary": "Brief overview of code health",
  "hasCriticalBugs": boolean,
  "findings": [
    {
      "id": "bug_1",
      "title": "Clear concise title",
      "category": "syntax" | "compilation" | "runtime" | "logical" | "edge_case" | "security" | "performance" | "memory" | "code_quality",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "lineStart": number (optional),
      "lineEnd": number (optional),
      "codeSnippet": "code snippet (optional)",
      "explanation": "Detailed explanation of why it is an issue",
      "impact": "Concrete consequence of this bug",
      "suggestedCorrection": "Actionable correction",
      "confidence": "high" | "medium" | "low",
      "demonstrationTestCase": { "input": "...", "expectedFailure": "..." } (optional)
    }
  ],
  "proposedFixSummary": "High-level summary of proposed fixes"
}

Code to analyze:
\`\`\`${language}
${code}
\`\`\`
${runtimeError ? `Runtime/Compiler Error Context:\n${runtimeError}` : ""}`;

        const rawData = await this.gemini.generateJson<DebugAnalysisResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return DebugAnalysisResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini findMistakes error, using deterministic fallback:", err.message);
        return this.fallback.analyzeBugs(code, language, runtimeError);
      }
    }

    return this.fallback.analyzeBugs(code, language, runtimeError);
  }

  async fixCode(
    code: string,
    language: string,
    bugs?: string,
    options?: AIOptions
  ): Promise<FixCodeResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Fix all bugs, safety issues, and performance bottlenecks in the following ${language} code.${detail}
Preserve the original intent, algorithm structure, and existing comments where valid.
Return a JSON object with this structure:
{
  "originalCode": string,
  "fixedCode": "Full corrected source code ready for execution",
  "summaryOfChanges": "Clear overview of what was fixed",
  "changesList": ["Detailed change 1", "Detailed change 2"],
  "riskLevel": "low" | "medium" | "high",
  "compilationExpected": true
}

Original Code:
\`\`\`${language}
${code}
\`\`\`
${bugs ? `Issues detected:\n${bugs}` : ""}`;

        const rawData = await this.gemini.generateJson<FixCodeResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return FixCodeResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini fixCode error, using deterministic fallback:", err.message);
        return this.fallback.fixCode(code, language);
      }
    }

    return this.fallback.fixCode(code, language);
  }

  async analyzeComplexity(
    code: string,
    language: string,
    options?: AIOptions
  ): Promise<ComplexityAnalysisResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Perform rigorous asymptotic time and auxiliary space complexity analysis on this ${language} code.${detail}
Return a JSON object with this structure:
{
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "bestCase": "O(...)",
  "averageCase": "O(...)",
  "worstCase": "O(...)",
  "dominantOperations": "Explanation of dominant loop or recursive operations",
  "loopAndRecursionAnalysis": "Detailed recurrence or loop count analysis",
  "assumptions": ["Assumption 1", "Assumption 2"],
  "bottlenecks": ["Bottleneck 1"],
  "alternativeApproaches": [
    {
      "name": "Alternative Name",
      "timeComplexity": "O(...)",
      "spaceComplexity": "O(...)",
      "tradeoff": "Why use this instead"
    }
  ],
  "isEstimated": boolean,
  "confidence": "high" | "medium" | "low",
  "explanation": "Clear, mathematically sound explanation"
}

Code:
\`\`\`${language}
${code}
\`\`\``;

        const rawData = await this.gemini.generateJson<ComplexityAnalysisResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return ComplexityAnalysisResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini analyzeComplexity error, using fallback:", err.message);
        return this.fallback.analyzeComplexity(code, language);
      }
    }

    return this.fallback.analyzeComplexity(code, language);
  }

  async optimizeCode(
    code: string,
    language: string,
    options?: AIOptions
  ): Promise<OptimizationResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Optimize the following ${language} code for better algorithmic complexity, memory locality, and modern language best practices.${detail}
Return a JSON object conforming strictly to:
{
  "category": "algorithmic" | "redundant_work" | "data_structures" | "memory_allocation" | "readability",
  "currentComplexity": "O(...)",
  "optimizedComplexity": "O(...)",
  "explanation": "Why this optimization improves efficiency",
  "keyChanges": ["Change 1", "Change 2"],
  "optimizedCode": "Complete runnable optimized code",
  "benchmarkEstimate": "Estimated realistic speedup / memory savings"
}

Code:
\`\`\`${language}
${code}
\`\`\``;

        const rawData = await this.gemini.generateJson<OptimizationResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return OptimizationResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini optimizeCode error, using fallback:", err.message);
        return this.fallback.generateOptimizedCode(code, language);
      }
    }

    return this.fallback.generateOptimizedCode(code, language);
  }

  async generateTests(
    code: string,
    language: string,
    options?: AIOptions
  ): Promise<TestSuiteResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Generate a robust test suite covering edge cases, normal cases, boundary values, empty inputs, and stress conditions for this ${language} program.${detail}
Return a JSON object conforming strictly to:
{
  "overallExplanation": "Overview of test coverage strategy",
  "testCases": [
    {
      "id": "tc_1",
      "name": "Case Title",
      "category": "normal" | "boundary" | "empty_input" | "minimum" | "maximum" | "duplicate" | "negative" | "invalid" | "adversarial",
      "input": "input representation or stdin",
      "expectedOutput": "expected return or stdout",
      "explanation": "Why this test matters"
    }
  ]
}

Code:
\`\`\`${language}
${code}
\`\`\``;

        const rawData = await this.gemini.generateJson<TestSuiteResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return TestSuiteResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini generateTests error, using fallback:", err.message);
        return this.fallback.generateTests(code, language);
      }
    }

    return this.fallback.generateTests(code, language);
  }

  async explainCode(
    code: string,
    language: string,
    selectedSnippet?: string,
    options?: AIOptions
  ): Promise<ExplainCodeResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Explain the following ${language} code in depth.${detail}
Return a JSON object conforming strictly to:
{
  "summary": "Clear, concise overview of what this program does",
  "algorithmApproach": "Core algorithmic strategy or pattern used",
  "keyComponents": [
    {
      "name": "Component Name",
      "description": "What it does",
      "lineRange": "1-10"
    }
  ],
  "stepByStepExplanation": ["Step 1", "Step 2", "Step 3"],
  "edgeCasesHandled": ["Edge case 1", "Edge case 2"],
  "timeSpaceSummary": "Brief Big-O time and space summary"
}

Code:
\`\`\`${language}
${code}
\`\`\`
${selectedSnippet ? `Selected Sub-snippet Focus:\n\`\`\`${language}\n${selectedSnippet}\n\`\`\`` : ""}`;

        const rawData = await this.gemini.generateJson<ExplainCodeResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return ExplainCodeResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini explainCode error, using fallback:", err.message);
        return this.fallback.explainCode(code, language);
      }
    }

    return this.fallback.explainCode(code, language);
  }

  async reviewCode(
    code: string,
    language: string,
    options?: AIOptions
  ): Promise<CodeReviewResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Perform a comprehensive, professional code review of the following ${language} code according to modern engineering standards (clean code, architecture, performance, security, style, best practices).${detail}
Return a JSON object conforming strictly to:
{
  "score": 85,
  "grade": "A",
  "summary": "Executive summary of code quality",
  "items": [
    {
      "id": "rev_1",
      "category": "architecture",
      "severity": "suggestion",
      "title": "Clear finding title",
      "description": "Detailed explanation",
      "lineStart": 1,
      "lineEnd": 5,
      "recommendation": "Concrete actionable recommendation"
    }
  ],
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"]
}

Code:
\`\`\`${language}
${code}
\`\`\``;

        const rawData = await this.gemini.generateJson<CodeReviewResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return CodeReviewResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini reviewCode error, using fallback:", err.message);
        return this.fallback.reviewCode(code, language);
      }
    }

    return this.fallback.reviewCode(code, language);
  }

  async explainError(
    error: string,
    code: string,
    language: string,
    options?: AIOptions
  ): Promise<ErrorExplanationResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `A ${language} program encountered this compiler or runtime error:${detail}
\`\`\`
${error}
\`\`\`

Here is the source code:
\`\`\`${language}
${code}
\`\`\`

Explain why this error occurred in plain English and provide the exact fix.
Return a JSON object conforming strictly to:
{
  "errorType": "Specific error category (e.g. Segmentation Fault, SyntaxError, NullReferenceException)",
  "rootCause": "Deep technical cause of why it happened",
  "plainEnglishExplanation": "Intuitive beginner-to-intermediate explanation",
  "offendingLocation": {
    "line": 1,
    "snippet": "code at error location"
  },
  "suggestedFix": "Step-by-step instructions on how to resolve it",
  "fixedCodeSnippet": "Corrected replacement snippet",
  "preventionAdvice": "Best practices to prevent this class of error in the future"
}`;

        const rawData = await this.gemini.generateJson<ErrorExplanationResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return ErrorExplanationResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini explainError error, using fallback:", err.message);
        return this.fallback.explainError(error, code, language);
      }
    }

    return this.fallback.explainError(error, code, language);
  }

  async generateDocumentation(
    code: string,
    language: string,
    options?: AIOptions
  ): Promise<DocumentationResult> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const prompt = `Generate comprehensive developer documentation and an architectural README for this ${language} codebase.${detail}
Return a JSON object conforming strictly to:
{
  "title": "Module Title",
  "overview": "High level overview",
  "architectureNotes": "Architecture design pattern notes",
  "apiReference": [
    {
      "identifier": "function_or_class_name",
      "kind": "function" | "class" | "method" | "interface" | "constant",
      "description": "What it does",
      "parameters": [{ "name": "param1", "type": "type", "description": "desc" }],
      "returnType": "returns type and behavior"
    }
  ],
  "usageExample": "Complete runnable code example",
  "markdownReadme": "Complete Github-ready Markdown README text"
}

Code:
\`\`\`${language}
${code}
\`\`\``;

        const rawData = await this.gemini.generateJson<DocumentationResult>(
          prompt,
          undefined,
          { model: options?.model }
        );
        return DocumentationResultSchema.parse(rawData);
      } catch (err: any) {
        console.warn("Gemini generateDocumentation error, using fallback:", err.message);
        return this.fallback.generateDocumentation(code, language);
      }
    }

    return this.fallback.generateDocumentation(code, language);
  }

  async chat(
    message: string,
    codeContext?: { code: string; language: string; activeFileName?: string },
    options?: AIOptions
  ): Promise<string> {
    if (this.gemini.isConfigured()) {
      try {
        const detail = formatDetailInstruction(options?.detailLevel);
        const contextPrompt = codeContext
          ? `Current Editor Context:
File: ${codeContext.activeFileName || "main"} (${codeContext.language})
\`\`\`${codeContext.language}
${codeContext.code}
\`\`\`\n\nUser Question: ${message}${detail}`
          : `${message}${detail}`;

        return await this.gemini.generateText(contextPrompt, undefined, {
          model: options?.model,
        });
      } catch (err: any) {
        console.warn("Gemini chat error:", err.message);
      }
    }

    // Contextual fallback response
    return `### CodeLynx AI Assistant (Offline Dev Mode)

I am currently running in offline development mode. To connect me directly to Gemini AI, set \`GEMINI_API_KEY\` in your \`.env\` file.

**Analysis of your query:** "${message}"

${
  codeContext
    ? `**Current Code Context:** Language \`${codeContext.language}\` (${codeContext.code.split("\n").length} lines).
- Your algorithm currently exhibits clean structure.
- You can use the **Find Mistakes** button above to check for runtime bounds and off-by-one errors.
- You can use **Analyze Complexity** to calculate Big-O time and auxiliary space.`
    : `Feel free to select code or ask about algorithm design, time complexity, and data structures!`
}`;
  }
}

export const aiService = new AIService();
