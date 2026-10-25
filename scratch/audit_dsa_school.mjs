import { problemRegistry } from "../lib/dsa/problem-registry.ts";
import { sanitizePublicProblem } from "../lib/dsa/types.ts";
import { DSA_TOPICS, TOPIC_LEARNING_PATHS } from "../lib/dsa/taxonomy.ts";

async function auditDSA() {
  console.log("=== AUDITING DSA SCHOOL & ALGORITHM PLATFORM ===");

  const allProblems = problemRegistry.getAllProblems();
  const counts = problemRegistry.getProblemCount();

  console.log(`1. Total Published Problems: ${allProblems.length}`);
  console.log(`   - Easy: ${counts.easy}`);
  console.log(`   - Medium: ${counts.medium}`);
  console.log(`   - Hard: ${counts.hard}`);

  // Check unique IDs and Slugs
  const ids = new Set();
  const slugs = new Set();
  let duplicates = 0;

  for (const p of allProblems) {
    if (ids.has(p.id)) duplicates++;
    if (slugs.has(p.slug)) duplicates++;
    ids.add(p.id);
    slugs.add(p.slug);
  }
  console.log(`2. Duplicate IDs or Slugs: ${duplicates} (Expected: 0)`);

  // Check Taxonomy & Paths
  console.log(`3. Total Taxonomy Topics: ${DSA_TOPICS.length} (Expected: >= 50)`);
  console.log(`4. Learning Paths: ${TOPIC_LEARNING_PATHS.length} (Expected: 4)`);

  // Check Public API Sanitization Security
  const sample = allProblems[0];
  const sanitized = sanitizePublicProblem(sample);
  const leakedHidden = Boolean(sanitized.hiddenTestCases);
  const leakedSolution = Boolean(sanitized.referenceSolution);
  console.log(`5. Hidden tests leaked: ${leakedHidden} (Expected: false)`);
  console.log(`6. Reference solution leaked: ${leakedSolution} (Expected: false)`);

  // Check Daily Challenge
  const todayChallenge = problemRegistry.getDailyChallenge("2026-10-30");
  console.log(`7. Daily Challenge for 2026-10-30: "${todayChallenge.title}" (${todayChallenge.slug})`);

  // Verify Problem Details via API
  const apiRes = await fetch("http://127.0.0.1:3001/api/dsa/problems?limit=10");
  const apiData = await apiRes.json();
  console.log(`8. Live API returned problems: ${apiData.problems?.length}, Total in pagination: ${apiData.pagination?.total}`);
}

auditDSA().catch(console.error);
