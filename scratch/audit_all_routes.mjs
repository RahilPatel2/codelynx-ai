async function auditRoutes() {
  const routes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard",
    "/workspace",
    "/projects",
    "/documentation",
    "/settings",
    "/history",
    "/assistant",
    "/problems",
    "/problems/two-sum-target-pair",
    "/features",
    "/pricing"
  ];

  console.log("=== AUDITING ALL APPLICATION ROUTES ===");
  const results = [];

  for (const r of routes) {
    const start = Date.now();
    try {
      const res = await fetch(`http://127.0.0.1:3001${r}`, {
        headers: { "User-Agent": "CodeLynx-Production-Auditor" }
      });
      const duration = Date.now() - start;
      const html = await res.text();
      const hasError = html.includes("Application error") || html.includes("500 Internal Server Error");
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : "N/A";
      
      results.push({
        route: r,
        status: res.status,
        durationMs: duration,
        title,
        hasError,
        ok: res.ok && !hasError
      });
      console.log(`[${res.status}] ${r} (${duration}ms) - Title: "${title}"`);
    } catch (err) {
      results.push({
        route: r,
        status: 0,
        error: err.message,
        ok: false
      });
      console.error(`[FAIL] ${r}: ${err.message}`);
    }
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\nRoute Audit Summary: ${results.length - failed.length}/${results.length} routes OK.`);
  if (failed.length > 0) {
    console.error("Failed routes:", failed);
  }
}

auditRoutes().catch(console.error);
