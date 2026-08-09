import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeContext";
import { AuthProvider } from "@/components/shared/AuthContext";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { SettingsProvider } from "@/components/shared/SettingsContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "CODELYNX AI — Understand Your Code. Improve Your Thinking.",
  description:
    "Premium AI-powered developer platform combining Monaco Editor, multi-language compiler, AI debugging, Big-O complexity analysis, and optimization.",
  keywords: [
    "CodeLynx AI",
    "online compiler",
    "AI debugger",
    "complexity analyzer",
    "Big-O",
    "code optimizer",
    "developer workspace",
    "Judge0",
    "Gemini",
  ],
  authors: [{ name: "CodeLynx AI Engineering Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem('codelynx_theme') || 'dark';
                var root = document.documentElement;
                if (storedTheme === 'light') {
                  root.classList.remove('dark');
                  root.classList.add('light');
                  root.setAttribute('data-theme', 'light');
                  root.style.colorScheme = 'light';
                } else {
                  root.classList.remove('light');
                  root.classList.add('dark');
                  root.setAttribute('data-theme', 'dark');
                  root.style.colorScheme = 'dark';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased selection:bg-indigo-500/30 transition-colors duration-150`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <ToastProvider>{children}</ToastProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
