import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Captain Aura — Know How to Show Up",
    template: "%s · Captain Aura",
  },
  description:
    "Personalized style recommendations built around you, your situation and the weather.",
  applicationName: "Captain Aura",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Captain Aura",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Captain Aura — Know How to Show Up",
    description:
      "Tell Captain Aura what you're doing. Get an outfit built around you, your wardrobe and the weather.",
    type: "website",
    siteName: "Captain Aura",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Font variables must live on <html>: Tailwind resolves --font-sans at
    // :root, so a variable declared further down the tree would never apply.
    <html lang="en" className={`${jakarta.variable} ${geistMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
