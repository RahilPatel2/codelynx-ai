async function auditAI() {
  const sampleBuggyCode = `def add(a, b):
    return a - b
`;

  // Fix Code
  const fixRes = await fetch("http://127.0.0.1:3001/api/ai/fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: sampleBuggyCode,
      language: "python",
      bugsSummary: "Subtraction instead of addition"
    })
  });
  const fixData = await fixRes.json();
  console.log("Fix Status:", fixRes.status, "Fixed Code Excerpt:", `"${fixData.fix?.fixedCode?.trim()}"`);

  // Next-Step Coding Guide
  const nextRes = await fetch("http://127.0.0.1:3001/api/ai/next-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: sampleBuggyCode,
      language: "python",
      context: {
        activeFile: { name: "main.py", language: "python", content: sampleBuggyCode },
        diagnostics: [{ line: 2, message: "Logical bug" }]
      }
    })
  });
  const nextData = await nextRes.json();
  console.log("Next Step Status:", nextRes.status, "Action:", nextData.nextStep?.recommendedActionType);
}

auditAI().catch(console.error);
