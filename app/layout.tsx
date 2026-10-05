import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGSITS Placement Tracker",
  description: "Explore placement outcomes from SGSITS Indore.",
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
