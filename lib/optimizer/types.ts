export interface CodeChange {
  id: string;
  originalRange?: { startLine: number; endLine: number };
  originalSnippet: string;
  replacementSnippet: string;
  reason: string;
  expectedBenefit: string;
  possibleTradeoffs?: string;
  preservesBehavior: boolean;
}

export interface OptimizerSnapshot {
  snapshotId: string;
  fileId: string;
  fileName: string;
  sourceText: string;
  language: string;
  contentHash: string;
  sourceVersion: number;
  timestamp: number;
}

export type CandidateValidationStatus =
  | "verified"
  | "unverified"
  | "validation_failed"
  | "syntax_error";

export interface CandidateValidation {
  status: CandidateValidationStatus;
  compilationChecked: boolean;
  compilationPassed?: boolean;
  validationMessage: string;
  behaviorPreserved?: boolean;
}

export interface VerifiedOptimizationResult {
  snapshotId: string;
  fileId: string;
  hasMeaningfulChanges: boolean;
  isIdentical: boolean;
  category:
    | "algorithmic"
    | "data_structures"
    | "redundant_work"
    | "memory_allocation"
    | "readability"
    | "none";
  originalComplexity?: string;
  candidateComplexity?: string;
  candidateSource: string;
  changes: CodeChange[];
  explanation: string;
  evidence: {
    algorithmicJustification?: string;
    runtimeBenchmark?: {
      measured: boolean;
      originalMs?: number;
      candidateMs?: number;
      speedupFactor?: number;
      testInputDescription?: string;
    };
    memoryMeasurement?: {
      measured: boolean;
      originalKb?: number;
      candidateKb?: number;
    };
    qualitativeNotes: string[];
  };
  validation: CandidateValidation;
}
