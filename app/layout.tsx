import { Head } from "nextra/components";
import { Poppins, Lora, Fira_Code } from "next/font/google";
import "nextra-theme-docs/style.css";
import "./globals.css";

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins",
	display: "swap",
});

const lora = Lora({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-lora",
	display: "swap",
});

const firaCode = Fira_Code({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-fira-code",
	display: "swap",
});

export const metadata = {
	title: "Nano Collective Docs",
	description: "Official documentation for Nano Collective projects",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			dir="ltr"
			suppressHydrationWarning
			className={`${poppins.variable} ${lora.variable} ${firaCode.variable}`}
		>
			<Head />
			<body className="antialiased">{children}</body>
		</html>
	);
}
