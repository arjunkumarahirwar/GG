import type { Metadata } from "next";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Mock Test",
  description: "Competitive exam mock tests with timer and locked solutions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </NextThemesProvider>
      </body>
    </html>
  );
}
