import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { CollectiveDocsSection } from "./components/home/CollectiveDocsSection";
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
    CollectiveDocsSection,
    ...components,
  };
}
