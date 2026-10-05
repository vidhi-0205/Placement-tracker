import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Placement Tracker",
  description: "Track your placement applications and progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
