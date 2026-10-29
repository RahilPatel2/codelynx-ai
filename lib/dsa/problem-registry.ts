import { DSAProblem, PublicDSAProblem, sanitizePublicProblem } from "./types";
import { ARRAY_PROBLEMS } from "./data/arrays";
import { STRING_PROBLEMS } from "./data/strings";
import { DP_PROBLEMS } from "./data/dynamic-programming";
import { TREE_PROBLEMS } from "./data/trees";
import { GRAPH_PROBLEMS } from "./data/graphs";
import { generateCuratedProblems } from "./generator";

class ProblemRegistry {
  private problems: DSAProblem[] = [];
  private slugMap: Map<string, DSAProblem> = new Map();
  private idMap: Map<string, DSAProblem> = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // 1. Load hand-crafted gold-standard problems
    const curated = [
      ...ARRAY_PROBLEMS,
      ...STRING_PROBLEMS,
      ...DP_PROBLEMS,
      ...TREE_PROBLEMS,
      ...GRAPH_PROBLEMS,
    ];

    // 2. Load generated problem bank covering full taxonomy
    const generated = generateCuratedProblems();

    // 3. Combine without duplicates
    const all = [...curated, ...generated];
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();

    for (const p of all) {
      if (!seenIds.has(p.id) && !seenSlugs.has(p.slug)) {
        seenIds.add(p.id);
        seenSlugs.add(p.slug);
        this.problems.push(p);
        this.slugMap.set(p.slug, p);
        this.idMap.set(p.id, p);
      }
    }

    this.initialized = true;
  }

  public getAllProblems(): DSAProblem[] {
    return this.problems;
  }

  public getAllPublicProblems(): PublicDSAProblem[] {
    return this.problems.map(sanitizePublicProblem);
  }

  public getProblemBySlug(slug: string): DSAProblem | undefined {
    return this.slugMap.get(slug);
  }

  public getPublicProblemBySlug(slug: string): PublicDSAProblem | undefined {
    const p = this.slugMap.get(slug);
    return p ? sanitizePublicProblem(p) : undefined;
  }

  public getProblemById(id: string): DSAProblem | undefined {
    return this.idMap.get(id);
  }

  public getPublicProblemById(id: string): PublicDSAProblem | undefined {
    const p = this.idMap.get(id);
    return p ? sanitizePublicProblem(p) : undefined;
  }

  public getProblemsByTopic(topicId: string): DSAProblem[] {
    return this.problems.filter(
      (p) => p.primaryTopic === topicId || p.secondaryTopics.includes(topicId)
    );
  }

  public getProblemCount(): { total: number; easy: number; medium: number; hard: number } {
    let easy = 0,
      medium = 0,
      hard = 0;
    for (const p of this.problems) {
      if (p.difficulty === "easy") easy++;
      else if (p.difficulty === "medium") medium++;
      else if (p.difficulty === "hard") hard++;
    }
    return { total: this.problems.length, easy, medium, hard };
  }

  /**
   * Deterministically selects the Daily Challenge for a given YYYY-MM-DD
   */
  public getDailyChallenge(dateStr?: string): PublicDSAProblem {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < targetDate.length; i++) {
      hash = (hash << 5) - hash + targetDate.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % this.problems.length;
    return sanitizePublicProblem(this.problems[index]);
  }
}

export const problemRegistry = new ProblemRegistry();
