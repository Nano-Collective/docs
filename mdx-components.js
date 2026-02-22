import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { ProjectList } from "./components/ProjectList";
import { HeroSection } from "./components/home/HeroSection";
import { QuickLinksSection } from "./components/home/QuickLinksSection";
import { ProjectCardsSection } from "./components/home/ProjectCardsSection";

// Get the default MDX components
const themeComponents = getThemeComponents();

// Merge components
export function useMDXComponents(components) {
	return {
		...themeComponents,
		ProjectList,
		HeroSection,
		QuickLinksSection,
		ProjectCardsSection,
		...components,
	};
}
