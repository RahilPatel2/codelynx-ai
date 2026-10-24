async function auditAuth() {
  console.log("=== AUDITING AUTHENTICATION SYSTEM ===");

  const timestamp = Date.now();
  const testUser = {
    name: "Auditor Test",
    email: `auditor_${timestamp}@codelynx.ai`,
    password: "SecurePassword123!"
  };

  // 1. Weak password test
  const weakRes = await fetch("http://127.0.0.1:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Weak", email: `weak_${timestamp}@test.com`, password: "short" })
  });
  console.log("1. Weak password rejected:", weakRes.status === 400);

  // 2. Successful Registration
  const regRes = await fetch("http://127.0.0.1:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  const setCookie = regRes.headers.get("set-cookie");
  console.log("2. Registration success:", regRes.status === 200, "Cookie set:", Boolean(setCookie));

  // 3. Duplicate Registration test
  const dupRes = await fetch("http://127.0.0.1:3001/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser)
  });
  console.log("3. Duplicate registration rejected:", dupRes.status === 409);

  // 4. Login with bad password
  const badLogin = await fetch("http://127.0.0.1:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testUser.email, password: "WrongPassword123!" })
  });
  console.log("4. Bad password rejected:", badLogin.status === 401);

  // 5. Login with correct password
  const goodLogin = await fetch("http://127.0.0.1:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testUser.email, password: testUser.password })
  });
  const loginCookie = goodLogin.headers.get("set-cookie");
  console.log("5. Valid login succeeded:", goodLogin.status === 200, "Cookie:", Boolean(loginCookie));

  // 6. Check Session with Cookie
  if (loginCookie) {
    const sessionRes = await fetch("http://127.0.0.1:3001/api/auth/session", {
      headers: { Cookie: loginCookie }
    });
    const sessionData = await sessionRes.json();
    console.log("6. Session verified:", sessionData.authenticated === true, "User email:", sessionData.user?.email);
  }

  // 7. Check Session WITHOUT Cookie
  const noCookieRes = await fetch("http://127.0.0.1:3001/api/auth/session");
  const noCookieData = await noCookieRes.json();
  console.log("7. Unauthenticated session check:", noCookieData.authenticated === false);

  // 8. Demo User Login
  const demoLogin = await fetch("http://127.0.0.1:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@codelynx.ai", password: "Password123!" })
  });
  console.log("8. Demo login succeeded:", demoLogin.status === 200);
}

auditAuth().catch(console.error);
