"use client";

import { Badge } from "@/components/ui/badge";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

export function HeroSection() {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Light mode colors
	const lightColors = {
		color1: "#f5f5f5",
		color2: "#eaeaea",
		color3: "#fafafa",
		brightness: 1.2,
	};

	// Dark mode colors - Tokyo Night inspired purples
	const darkColors = {
		color1: "#1a1b26", // Tokyo Night base
		color2: "#24283b", // Tokyo Night surface
		color3: "#292f4a", // Tokyo Night comment/muted
		brightness: 0.4,
	};

	const colors = mounted && resolvedTheme === "dark" ? darkColors : lightColors;

	return (
		<section className="relative min-h-[400px] overflow-hidden py-24 border-b border-b-muted">
			<div className="absolute inset-0 z-0 [clip-path:inset(0)]">
				<ShaderGradientCanvas
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						pointerEvents: "none",
					}}
					lazyLoad={false}
				>
					<ShaderGradient
						type="plane"
						animate="on"
						uTime={0}
						uSpeed={0.1}
						uStrength={4}
						uDensity={1.3}
						uFrequency={5.5}
						uAmplitude={1}
						positionX={-1.4}
						positionY={0}
						positionZ={0}
						rotationX={0}
						rotationY={10}
						rotationZ={50}
						color1={colors.color1}
						color2={colors.color2}
						color3={colors.color3}
						reflection={0.1}
						wireframe={false}
						shader="defaults"
						cAzimuthAngle={180}
						cPolarAngle={90}
						cDistance={3.6}
						cameraZoom={0.5}
						lightType="3d"
						brightness={colors.brightness}
						envPreset="city"
						grain="off"
					/>
				</ShaderGradientCanvas>
			</div>
			<div className="max-w-4xl mx-auto text-center space-y-8">
				<div className="inline-block animate-on-scroll">
					<Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
						Documentation
					</Badge>
				</div>
				<h1 className="text-5xl sm:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent animate-on-scroll animate-delay-100">
					Nano Docs
				</h1>
				<p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-on-scroll animate-delay-200">
					Official documentation for Nano Collective projects. Find guides, API
					references, and examples to help you build with our tools.
				</p>
			</div>
		</section>
	);
}
