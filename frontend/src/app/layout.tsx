import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartAssess",
  description: "Premium Online Examination Platform",
  manifest: "/manifest.webmanifest",
  themeColor: "#2463eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} h-full antialiased`}
      >

        <body className="min-h-full flex flex-col">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '14px', fontWeight: '600', fontSize: '14px' },
              success: { iconTheme: { primary: '#2563eb', secondary: '#fff' } },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
