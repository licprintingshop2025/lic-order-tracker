import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://track.licprintingshop.net"),

  title: "LIC Printing Corporation | Order Tracker",

  description:
    "Track your BIR receipt and invoice printing order with LIC Printing Corporation.",

  icons: {
    icon: [
      {
        url: "/lic-logo.jpg",
        type: "image/jpeg",
      },
    ],
    shortcut: "/lic-logo.jpg",
    apple: "/lic-logo.jpg",
  },

  openGraph: {
    title: "LIC Printing Corporation | Order Tracker",
    description:
      "Track your BIR receipt and invoice printing order with LIC Printing Corporation.",
    url: "https://track.licprintingshop.net",
    siteName: "LIC Printing Corporation",
    images: [
      {
        url: "/lic-logo.jpg",
        width: 1576,
        height: 1600,
        alt: "LIC Printing Corporation",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "LIC Printing Corporation | Order Tracker",
    description:
      "Track your BIR receipt and invoice printing order with LIC Printing Corporation.",
    images: ["/lic-logo.jpg"],
  },
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
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}