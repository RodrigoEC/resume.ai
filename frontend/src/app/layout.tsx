import type { Metadata } from "next";
import { Kalam } from "next/font/google";
import "./globals.css";

/*
  Kalam is the spec's display + body face (weights 400 and 700). Loaded via
  next/font/google so it is self-hosted and non-render-blocking; exposed as a
  CSS variable that globals.css maps to --font-hand.
*/
const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "resume.ai",
  description:
    "Turn your spoken stories into a resume tailored to any job description.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${kalam.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
