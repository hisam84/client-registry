import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Sans_Bengali, IBM_Plex_Mono } from "next/font/google";
import { AutoLogout } from "@/components/AutoLogout";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap",
});
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600"],
  variable: "--font-bengali",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Imperial IT | Client Registry",
  description: "The complete IT solution - Institution client database and management console",
  icons: {
    icon: "/pad.png",
    shortcut: "/pad.png",
    apple: "/pad.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/pad.png" type="image/png" />
        <link rel="apple-touch-icon" href="/pad.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${display.variable} ${sans.variable} ${bengali.variable} ${mono.variable} font-sans min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors`}
      >
        <AutoLogout />
        {children}
      </body>
    </html>
  );
}
