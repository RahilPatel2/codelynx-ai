export interface StdinDetectionResult {
  requiresStdin: boolean;
  patterns: string[];
  suggestedPlaceholder: string;
}

/**
 * Deterministically inspects source code for standard input operations across all supported languages.
 */
export function detectStdinUsage(code: string, language: string): StdinDetectionResult {
  if (!code || !code.trim()) {
    return { requiresStdin: false, patterns: [], suggestedPlaceholder: "" };
  }

  const normalizedLang = language.toLowerCase();
  const matchedPatterns: string[] = [];

  // Language specific regex patterns
  switch (normalizedLang) {
    case "cpp":
    case "c": {
      if (/\b(?:std::)?cin\s*>>/.test(code)) matchedPatterns.push("cin >>");
      if (/\bgetline\s*\(\s*(?:std::)?cin\b/.test(code)) matchedPatterns.push("getline(cin, ...)");
      if (/\bscanf\s*\(/.test(code)) matchedPatterns.push("scanf(...)");
      if (/\bgetchar\s*\(/.test(code)) matchedPatterns.push("getchar()");
      if (/\bfgets\s*\([^,]+,\s*[^,]+,\s*stdin\s*\)/.test(code)) matchedPatterns.push("fgets(..., stdin)");
      break;
    }

    case "python": {
      if (/\binput\s*\(/.test(code)) matchedPatterns.push("input(...)");
      if (/\bsys\.stdin\b/.test(code)) matchedPatterns.push("sys.stdin");
      break;
    }

    case "java": {
      if (/new\s+Scanner\s*\(\s*System\.in\s*\)/.test(code)) matchedPatterns.push("new Scanner(System.in)");
      if (/\bSystem\.in\b/.test(code) && !matchedPatterns.length) matchedPatterns.push("System.in");
      if (/BufferedReader\s*\(.*System\.in/.test(code)) matchedPatterns.push("BufferedReader(System.in)");
      break;
    }

    case "csharp": {
      if (/Console\.(?:ReadLine|Read)\s*\(/.test(code)) matchedPatterns.push("Console.ReadLine()");
      break;
    }

    case "rust": {
      if (/io::stdin\s*\(/.test(code) || /stdin\s*\(\)/.test(code)) matchedPatterns.push("io::stdin()");
      break;
    }

    case "go": {
      if (/fmt\.(?:Scan|Scanf|Scanln)\s*\(/.test(code)) matchedPatterns.push("fmt.Scan(...)");
      if (/os\.Stdin\b/.test(code)) matchedPatterns.push("os.Stdin");
      break;
    }

    case "javascript":
    case "typescript": {
      if (/readline\.createInterface/.test(code)) matchedPatterns.push("readline.createInterface");
      if (/readFileSync\s*\(\s*0\b/.test(code) || /readFileSync\s*\(\s*["']\/dev\/stdin["']/.test(code)) {
        matchedPatterns.push("fs.readFileSync(0)");
      }
      break;
    }

    default: {
      // General fallbacks
      if (/\b(?:cin|input|scanf|stdin|System\.in)\b/.test(code)) {
        matchedPatterns.push("Standard input token");
      }
    }
  }

  const requiresStdin = matchedPatterns.length > 0;

  let suggestedPlaceholder = "5 7\n";
  if (normalizedLang === "python") {
    suggestedPlaceholder = "Alice\n42\n";
  } else if (normalizedLang === "java" || normalizedLang === "cpp") {
    suggestedPlaceholder = "5\n10 20 30 40 50\n";
  }

  return {
    requiresStdin,
    patterns: matchedPatterns,
    suggestedPlaceholder,
  };
}
