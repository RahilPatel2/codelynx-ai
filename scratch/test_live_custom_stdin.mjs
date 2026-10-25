async function run() {
  const payload = {
    code: `name = input().strip()
print(f"Hello, {name}!")
`,
    language: "python",
    problemSlug: "two-sum-target-pair",
    customInput: "Rahil"
  };

  const res = await fetch("http://127.0.0.1:3001/api/dsa/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Run Result:", JSON.stringify(data.result, null, 2));
}

run().catch(console.error);
