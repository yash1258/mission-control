import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Mission Control | OpenClaw Dashboard",
    description: "System monitoring dashboard for OpenClaw AI agent framework",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="antialiased bg-base text-content-primary min-h-screen">
                {children}
            </body>
        </html>
    );
}
