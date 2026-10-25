async function run() {
  const payload = {
    code: `import sys
lines = [line.strip() for line in sys.stdin if line.strip()]
print(" -> ".join(lines))
`,
    language: "python",
    problemSlug: "two-sum-target-pair",
    customInput: "Step 1\nStep 2\nStep 3"
  };

  const res = await fetch("http://127.0.0.1:3001/api/dsa/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Actual Output:", data.result?.results?.[0]?.actualOutput);
}

run().catch(console.error);
