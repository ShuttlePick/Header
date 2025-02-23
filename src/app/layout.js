import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ShuttlePick",
  description: "Generated by create next app",
  icons: {
    icon: "/images/ShuttlePickLogo_1.png",
  },
};

{/* Header width:140px임 */}
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Header/>
        {children}
      </body>
    </html>
  );
}
