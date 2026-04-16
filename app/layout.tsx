import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkShort - Shorten Your URLs",
  description: "Create short, memorable links with analytics and QR codes. The easiest way to share and track your URLs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between gap-3 p-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Link Shortener</h1>
            <div className="flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center justify-center rounded-lg border border-primary text-primary bg-transparent px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
