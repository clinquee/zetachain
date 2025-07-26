import localFont from "next/font/local";
import "./globals.css";
import Providers from "../providers/RainbowKitProvider";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata = {
    title: "ZetaVault - AI-Powered Cross-Chain Agent",
    description:
        "Transform natural language into executable cross-chain actions with AI intelligence",
    keywords: "blockchain, cross-chain, AI, DeFi, ZetaChain, Web3",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black relative min-h-screen`}
            >


                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
