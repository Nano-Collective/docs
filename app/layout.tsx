import type { Metadata } from "next";
import { Fira_Code, Lora, Poppins } from "next/font/google";
import { Head } from "nextra/components";
import { JsonLd } from "@/components/JsonLd";
import "nextra-theme-docs/style.css";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fira-code",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.nanocollective.org"),
  title: "Nano Collective Docs",
  description: "Official documentation for Nano Collective projects",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Nano Collective Docs",
    description: "Official documentation for Nano Collective projects",
    url: "https://docs.nanocollective.org",
    siteName: "Nano Collective",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Nano Collective Docs",
    description: "Official documentation for Nano Collective projects",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${poppins.variable} ${lora.variable} ${firaCode.variable}`}
    >
      <Head />
      <body className="antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Nano Collective Docs",
            url: "https://docs.nanocollective.org",
            publisher: {
              "@type": "Organization",
              name: "Nano Collective",
              url: "https://nanocollective.org",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
