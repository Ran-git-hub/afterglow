import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Afterglow",
  description: "The world, after passing through machine imagination.",
  formatDetection: {
    address: false,
    email: false,
    telephone: false
  },
  other: {
    "format-detection": "telephone=no,date=no,address=no,email=no,url=no"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
