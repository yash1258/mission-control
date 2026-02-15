"use client";

import { ThemeProvider as ThemeProviderClient } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return <ThemeProviderClient>{children}</ThemeProviderClient>;
}
