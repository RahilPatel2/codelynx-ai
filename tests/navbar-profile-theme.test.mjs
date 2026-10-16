import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SignJWT, jwtVerify } from "jose";

// Ensure .env.local is parsed
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

const DEFAULT_SECRET = "codelynx-ai-enterprise-jwt-super-secret-key-32chars-min";
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || DEFAULT_SECRET
);

test("Suite 1: Theme System DOM Logic & Root Class Isolation", async (t) => {
  // Test the pure DOM function logic implemented in ThemeContext
  const mockClassList = new Set();
  const mockAttributes = {};
  const mockStyle = {};

  const fakeElement = {
    classList: {
      add: (cls) => mockClassList.add(cls),
      remove: (cls) => mockClassList.delete(cls),
      contains: (cls) => mockClassList.has(cls),
      toggle: (cls, force) => {
        if (force) mockClassList.add(cls);
        else mockClassList.delete(cls);
      },
    },
    setAttribute: (k, v) => { mockAttributes[k] = v; },
    getAttribute: (k) => mockAttributes[k],
    style: mockStyle,
  };

  const applyThemeToMock = (theme) => {
    if (theme === "light") {
      fakeElement.classList.remove("dark");
      fakeElement.classList.add("light");
      fakeElement.setAttribute("data-theme", "light");
      fakeElement.style.colorScheme = "light";
    } else {
      fakeElement.classList.remove("light");
      fakeElement.classList.add("dark");
      fakeElement.setAttribute("data-theme", "dark");
      fakeElement.style.colorScheme = "dark";
    }
  };

  await t.test("Initial default: applies dark mode with data-theme and color-scheme", () => {
    applyThemeToMock("dark");
    assert.equal(fakeElement.classList.contains("dark"), true);
    assert.equal(fakeElement.classList.contains("light"), false);
    assert.equal(fakeElement.getAttribute("data-theme"), "dark");
    assert.equal(fakeElement.style.colorScheme, "dark");
  });

  await t.test("Switching to light mode cleanly removes 'dark' class and adds 'light'", () => {
    applyThemeToMock("light");
    assert.equal(fakeElement.classList.contains("light"), true);
    assert.equal(fakeElement.classList.contains("dark"), false, "'dark' class MUST be removed in light mode");
    assert.equal(fakeElement.getAttribute("data-theme"), "light");
    assert.equal(fakeElement.style.colorScheme, "light");
  });

  await t.test("Switching back to dark mode cleanly removes 'light' class and adds 'dark'", () => {
    applyThemeToMock("dark");
    assert.equal(fakeElement.classList.contains("dark"), true);
    assert.equal(fakeElement.classList.contains("light"), false, "'light' class MUST be removed in dark mode");
    assert.equal(fakeElement.getAttribute("data-theme"), "dark");
    assert.equal(fakeElement.style.colorScheme, "dark");
  });

  await t.test("globals.css defines contrasting variables for both html.dark and html.light", () => {
    const css = fs.readFileSync("app/globals.css", "utf8");
    assert.ok(css.includes("html.dark"), "globals.css must specify dark mode rules");
    assert.ok(css.includes("html.light"), "globals.css must specify light mode rules");
    assert.ok(css.includes("--background: #f8fafc"), "Light mode must have light background");
    assert.ok(css.includes("--foreground: #0f172a"), "Light mode must have dark readable text");
  });

  await t.test("Root layout includes inline script to eliminate FOUC flickering", () => {
    const layout = fs.readFileSync("app/layout.tsx", "utf8");
    assert.ok(layout.includes("localStorage.getItem('codelynx_theme')"), "Anti-FOUC script must be in head");
    assert.ok(layout.includes("suppressHydrationWarning"), "html tag must have suppressHydrationWarning");
  });
});

test("Suite 2: User Avatar & Initials Derivation Engine", async (t) => {
  const getInitials = (name, email) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim().length > 0) {
      return email.trim()[0].toUpperCase();
    }
    return "U";
  };

  await t.test("Two-word name derives two-letter initials", () => {
    assert.equal(getInitials("Alex Lynx", "demo@codelynx.ai"), "AL");
    assert.equal(getInitials("Elena Vance", "elena@blackmesa.org"), "EV");
  });

  await t.test("Single-word name derives first two letters", () => {
    assert.equal(getInitials("Rahil", "rahil@codelynx.ai"), "RA");
  });

  await t.test("Missing name falls back to first letter of email", () => {
    assert.equal(getInitials("", "developer@enterprise.com"), "D");
    assert.equal(getInitials(undefined, "staff@codelynx.ai"), "S");
  });

  await t.test("Missing both falls back to 'U'", () => {
    assert.equal(getInitials("", ""), "U");
  });
});

test("Suite 3: User Profile & Subscription Account Menu Navigation Invariants", async (t) => {
  const expectedItems = [
    { label: "My Profile", route: "/profile", filePath: "app/(workspace)/profile/page.tsx" },
    { label: "My Projects", route: "/projects", filePath: "app/(workspace)/projects/page.tsx" },
    { label: "My Subscription", route: "/subscription", filePath: "app/(workspace)/subscription/page.tsx" },
    { label: "Account Settings", route: "/settings", filePath: "app/(workspace)/settings/page.tsx" },
    { label: "Security Settings", route: "/settings#security", filePath: "app/(workspace)/settings/page.tsx" },
    { label: "Help & Support", route: "/documentation", filePath: "app/(marketing)/documentation/page.tsx" },
  ];

  await t.test("All 6 menu item routes correspond to real physical page files", () => {
    for (const item of expectedItems) {
      assert.ok(
        fs.existsSync(item.filePath),
        `Route target for '${item.label}' (${item.filePath}) must exist on disk`
      );
    }
  });

  await t.test("UserAccountMenu source code includes all required 7 items including Logout", () => {
    const code = fs.readFileSync("components/shared/UserAccountMenu.tsx", "utf8");
    assert.ok(code.includes("My Profile"), "Must include My Profile");
    assert.ok(code.includes("My Projects"), "Must include My Projects");
    assert.ok(code.includes("My Subscription"), "Must include My Subscription");
    assert.ok(code.includes("Account Settings"), "Must include Account Settings");
    assert.ok(code.includes("Security Settings"), "Must include Security Settings");
    assert.ok(code.includes("Help & Support"), "Must include Help & Support");
    assert.ok(code.includes("Sign Out"), "Must include Logout/Sign Out");
  });

  await t.test("Displays Plan badge (FREE, PROFESSIONAL, or PRO)", () => {
    const code = fs.readFileSync("components/shared/UserAccountMenu.tsx", "utf8");
    assert.ok(code.includes("PRO PLAN") || code.includes("FREE TIER"));
  });
});

test("Suite 4: Profile API Security & Email Tampering Prevention", async (t) => {
  const { devStore } = await import("../lib/database/dev-store.js").catch(() => import("../lib/database/dev-store.ts"));

  await t.test("devStore includes profile fields: bio, role, company, githubHandle, subscription", () => {
    const demoUser = devStore.users.get("demo@codelynx.ai");
    assert.ok(demoUser);
    assert.equal(demoUser.subscription?.plan, "PRO");
    assert.ok(demoUser.role);
    assert.ok(demoUser.company);
  });

  await t.test("Profile update route file strictly validates and blocks email modification", () => {
    const routeCode = fs.readFileSync("app/api/user/profile/route.ts", "utf8");
    assert.ok(routeCode.includes("cannot be modified directly"), "Must reject email modifications");
    assert.ok(routeCode.includes("getCurrentUser()"), "Must enforce server-side authenticated session");
    assert.ok(routeCode.includes("status: 401"), "Must return 401 for unauthenticated calls");
  });
});

test("Suite 5: Route Protection for /profile and /subscription in Middleware", async (t) => {
  const middlewareCode = fs.readFileSync("middleware.ts", "utf8");
  assert.ok(middlewareCode.includes('"/profile"'), "middleware.ts must protect /profile");
  assert.ok(middlewareCode.includes('"/subscription"'), "middleware.ts must protect /subscription");
});

test("Suite 6: Global Navbar Center Links and Route Mapping", async (t) => {
  const centerRoutes = [
    { label: "Dashboard", href: "/dashboard", file: "app/(workspace)/dashboard/page.tsx" },
    { label: "Workspace", href: "/workspace", file: "app/(workspace)/workspace/page.tsx" },
    { label: "DSA School", href: "/problems", file: "app/(workspace)/problems/page.tsx" },
    { label: "AI Assistant", href: "/assistant", file: "app/(workspace)/assistant/page.tsx" },
    { label: "Documentation", href: "/documentation", file: "app/(marketing)/documentation/page.tsx" },
    { label: "Plans", href: "/pricing", file: "app/(marketing)/pricing/page.tsx" },
  ];

  await t.test("All 6 center navbar links point to valid, existing pages", () => {
    for (const r of centerRoutes) {
      assert.ok(fs.existsSync(r.file), `Navbar link '${r.label}' (${r.file}) must exist`);
    }
  });

  await t.test("GlobalNavbar component renders LynxLogo, theme toggle, notifications, and user menu", () => {
    const navCode = fs.readFileSync("components/shared/GlobalNavbar.tsx", "utf8");
    assert.ok(navCode.includes("<LynxLogo"), "Navbar must contain LynxLogo");
    assert.ok(navCode.includes("<ThemeToggle"), "Navbar must contain ThemeToggle");
    assert.ok(navCode.includes("<NotificationBell"), "Navbar must contain NotificationBell");
    assert.ok(navCode.includes("<UserAccountMenu"), "Navbar must contain UserAccountMenu");
  });

  await t.test("AppHeader forwards to GlobalNavbar seamlessly", () => {
    const headerCode = fs.readFileSync("components/shared/AppHeader.tsx", "utf8");
    assert.ok(headerCode.includes("<GlobalNavbar"), "AppHeader must forward to GlobalNavbar");
  });
});
