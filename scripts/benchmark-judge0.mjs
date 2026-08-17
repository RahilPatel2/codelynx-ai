import https from "node:https";

async function makeSubmission(label, code, languageId = 71) {
  const body = JSON.stringify({
    source_code: code,
    language_id: languageId,
    cpu_time_limit: 5,
    memory_limit: 128000,
  });

  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.request(
      "https://ce.judge0.com/submissions?wait=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const duration = Date.now() - start;
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            // non-json
          }
          resolve({
            label,
            statusCode: res.statusCode,
            durationMs: duration,
            statusDescription: parsed?.status?.description || "Unknown",
            stdout: parsed?.stdout?.trim(),
            time: parsed?.time,
            memory: parsed?.memory,
            headers: {
              rateLimitLimit: res.headers["x-ratelimit-limit"],
              rateLimitRemaining: res.headers["x-ratelimit-remaining"],
            },
          });
        });
      }
    );
    req.on("error", (err) => {
      resolve({ label, error: err.message });
    });
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("=================================================");
  console.log("JUDGE0 CE PRODUCTION SUITABILITY BENCHMARK");
  console.log("=================================================\n");

  console.log("1. Testing Single Sequential Request...");
  const seq1 = await makeSubmission("Simple Python", "print('Hello Production')");
  console.log("  Status Code:", seq1.statusCode);
  console.log("  Latency:", seq1.durationMs + "ms");
  console.log("  Execution Result:", seq1.statusDescription);
  console.log("  RateLimit Remaining:", seq1.headers.rateLimitRemaining || "Not exposed by CE");

  console.log("\n2. Testing 5 Concurrent Requests (Burst Concurrency)...");
  const burstStart = Date.now();
  const burstResults = await Promise.all([
    makeSubmission("Burst 1", "print(1)"),
    makeSubmission("Burst 2", "print(2)"),
    makeSubmission("Burst 3", "print(3)"),
    makeSubmission("Burst 4", "print(4)"),
    makeSubmission("Burst 5", "print(5)"),
  ]);
  const burstDuration = Date.now() - burstStart;
  console.log(`  5 Concurrent requests completed in ${burstDuration}ms:`);
  burstResults.forEach((r, i) => {
    console.log(`   - Req ${i + 1}: ${r.statusCode} (${r.durationMs}ms) - ${r.statusDescription}`);
  });

  console.log("\n3. Testing Hard Timeout Enforcement (Infinite Loop)...");
  const timeoutRes = await makeSubmission("Infinite Loop", "while True: pass");
  console.log("  Status Code:", timeoutRes.statusCode);
  console.log("  Latency:", timeoutRes.durationMs + "ms");
  console.log("  Result Status:", timeoutRes.statusDescription);

  console.log("\n=================================================");
  console.log("BENCHMARK ANALYSIS COMPLETE");
  console.log("=================================================");
}

run();
