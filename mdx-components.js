import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { HeroSection } from "./components/home/HeroSection";
import { ProjectCardsSection } from "./components/home/ProjectCardsSection";
import { QuickLinksSection } from "./components/home/QuickLinksSection";
import { ProjectList } from "./components/ProjectList";

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
