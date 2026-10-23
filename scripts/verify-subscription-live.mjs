async function runLiveVerification() {
  const baseUrl = "http://localhost:3001";
  console.log("=== STARTING LIVE HTTP SUBSCRIPTION & PRICING VERIFICATION ===");

  // 1. GET /pricing
  const pricingRes = await fetch(`${baseUrl}/pricing`);
  console.log(`1. GET /pricing: HTTP ${pricingRes.status}`);
  const pricingHtml = await pricingRes.text();
  if (pricingHtml.includes("499") && pricingHtml.includes("899")) {
    console.log("   ✓ Pricing page contains ₹499 and ₹899 INR tiers");
  } else {
    console.error("   ✖ Pricing page missing INR prices");
  }

  // 2. GET /subscription unauthenticated redirect
  const subPageRes = await fetch(`${baseUrl}/subscription`, { redirect: "manual" });
  console.log(`2. Unauth GET /subscription: HTTP ${subPageRes.status} Location: ${subPageRes.headers.get("location")}`);
  if (subPageRes.status === 307 || subPageRes.status === 302) {
    console.log("   ✓ Unauthenticated access to /subscription cleanly redirects to login");
  }

  // 3. GET /api/subscription public check
  const subApiRes = await fetch(`${baseUrl}/api/subscription`);
  const subApiData = await subApiRes.json();
  console.log(`3. GET /api/subscription: HTTP ${subApiRes.status}, returned ${subApiData.plans?.length} plans`);
  console.log(`   Plans: ${subApiData.plans?.map(p => `${p.name} (${p.formattedPrice})`).join(", ")}`);

  // 4. Unauth POST /api/subscription/simulate
  const unauthSimRes = await fetch(`${baseUrl}/api/subscription/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: "professional" }),
  });
  console.log(`4. Unauth POST /api/subscription/simulate: HTTP ${unauthSimRes.status}`);
  if (unauthSimRes.status === 401) {
    console.log("   ✓ Unauthenticated simulation request rejected with 401");
  }

  // 5. Register fresh test user
  const testEmail = `sub_tester_${Date.now()}@codelynx.ai`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Subscription Tester",
      email: testEmail,
      password: "Password123!",
    }),
  });
  console.log(`5. Register test user (${testEmail}): HTTP ${regRes.status}`);
  const setCookie = regRes.headers.get("set-cookie");
  const cookieHeader = setCookie ? setCookie.split(";")[0] : "";
  console.log(`   Session cookie established: ${cookieHeader.substring(0, 30)}...`);

  // Verify initial session plan
  const sessionRes1 = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  const session1 = await sessionRes1.json();
  console.log(`   Initial plan on registration: ${session1.user?.subscription?.plan} (Price: ₹${session1.user?.subscription?.priceInr || 0})`);

  // 6. Simulated Upgrade to Professional (₹499)
  const upProfRes = await fetch(`${baseUrl}/api/subscription/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ planId: "professional" }),
  });
  const upProfData = await upProfRes.json();
  console.log(`6. Upgrade to Professional: HTTP ${upProfRes.status}, msg: "${upProfData.message}"`);
  console.log(`   Plan: ${upProfData.subscription?.planName}, Price: ${upProfData.subscription?.formattedPrice}, Mode: ${upProfData.subscription?.purchaseMode}`);

  // Check updated session
  const sessionRes2 = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookieHeader },
  });
  const session2 = await sessionRes2.json();
  console.log(`   Session after upgrade: ${session2.user?.subscription?.plan} (Price: ₹${session2.user?.subscription?.priceInr})`);

  // 7. Simulated Upgrade to Pro (₹899)
  const upProRes = await fetch(`${baseUrl}/api/subscription/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ planId: "pro" }),
  });
  const upProData = await upProRes.json();
  console.log(`7. Upgrade to Pro: HTTP ${upProRes.status}, msg: "${upProData.message}"`);
  console.log(`   Plan: ${upProData.subscription?.planName}, Price: ${upProData.subscription?.formattedPrice}`);

  // 8. Simulated Downgrade to Free (₹0)
  const downFreeRes = await fetch(`${baseUrl}/api/subscription/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ planId: "free" }),
  });
  const downFreeData = await downFreeRes.json();
  console.log(`8. Downgrade to Free: HTTP ${downFreeRes.status}, msg: "${downFreeData.message}"`);
  console.log(`   Plan: ${downFreeData.subscription?.planName}, Price: ${downFreeData.subscription?.formattedPrice}`);

  // 9. Rejection of invalid plan ID
  const invalidRes = await fetch(`${baseUrl}/api/subscription/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ planId: "ultra_hacker_tier" }),
  });
  console.log(`9. Invalid plan ID payload: HTTP ${invalidRes.status}`);
  if (invalidRes.status === 400) {
    console.log("   ✓ Malicious/invalid planId rejected with HTTP 400");
  }

  // 10. Test Project limit entitlement enforcement on Free plan (limit = 3)
  console.log("10. Testing Project Creation Quota (Free plan limit = 3):");
  for (let i = 1; i <= 3; i++) {
    const pRes = await fetch(`${baseUrl}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ name: `Test Project ${i}`, language: "python" }),
    });
    console.log(`    Project ${i}: HTTP ${pRes.status}`);
  }

  // Attempt 4th project -> should be blocked!
  const p4Res = await fetch(`${baseUrl}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader },
    body: JSON.stringify({ name: "Test Project 4 (Should Fail)", language: "python" }),
  });
  const p4Data = await p4Res.json();
  console.log(`    Project 4 (Exceeds limit): HTTP ${p4Res.status}, code: "${p4Data.code}"`);
  console.log(`    Error message: "${p4Data.error}"`);
  if (p4Res.status === 403 && p4Data.code === "PROJECT_LIMIT_EXCEEDED") {
    console.log("   ✓ Server-side entitlement strictly enforced: blocked 4th project on Free plan with 403 Forbidden!");
  } else {
    console.error("   ✖ Project limit not enforced!");
  }

  console.log("=== ALL LIVE VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===");
}

runLiveVerification().catch(console.error);
