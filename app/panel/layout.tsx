"use client";

import { ThemeProvider } from "@/components/theme-provider";

/** Side panel always uses light chrome (extension iframe / assist focus). */
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
