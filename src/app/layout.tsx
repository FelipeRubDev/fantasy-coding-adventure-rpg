import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/800.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";
import "./expansion.css";

export const metadata: Metadata = {
  title: "El Códice Borrado · Aprende código escribiendo a mano",
  description: "Explora cuatro campañas de fantasía, aprende pseudocódigo, JavaScript, Java y MongoDB y reta a Corvo en un duelo de conceptos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0807",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
