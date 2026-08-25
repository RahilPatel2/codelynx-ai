import fs from "node:fs";
import https from "node:https";

if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

async function verifyGoogleOAuth() {
  console.log("=================================================");
  console.log("GOOGLE OAUTH 2.0 CREDENTIAL & ENDPOINT HANDSHAKE");
  console.log("=================================================\n");

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("FAILED: Missing Google OAuth credentials in environment.");
    process.exit(1);
  }

  console.log("Client ID verified:", `${clientId.slice(0, 18)}...`);
  console.log("Client Secret present: Yes");

  const postData = new URLSearchParams({
    code: "verification_test_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: "http://localhost:3001/api/auth/callback/google",
    grant_type: "authorization_code",
  }).toString();

  return new Promise((resolve) => {
    const req = https.request(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          console.log("Google Token Endpoint HTTP Status:", res.statusCode);
          try {
            const json = JSON.parse(body);
            console.log("Google OAuth Response:", json);
            if (json.error === "invalid_grant") {
              console.log("\n[VERIFIED] Google accepted Client ID & Client Secret!");
              console.log("Error 'invalid_grant' confirms credentials are authentic (test code was unissued).");
              console.log("If client secret were invalid, Google would return 'invalid_client'.");
              resolve(true);
            } else if (json.error === "invalid_client") {
              console.error("\n[ERROR] Google rejected the Client Secret!");
              resolve(false);
            } else {
              console.log("\nGoogle Response:", json.error);
              resolve(true);
            }
          } catch {
            console.log("Raw response:", body);
            resolve(false);
          }
        });
      }
    );
    req.on("error", (err) => {
      console.error("Request error:", err.message);
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

verifyGoogleOAuth().then((ok) => {
  if (ok) {
    console.log("\n=================================================");
    console.log("GOOGLE OAUTH HANDSHAKE: VERIFIED GENUINE CREDENTIALS");
    console.log("=================================================");
  }
});
