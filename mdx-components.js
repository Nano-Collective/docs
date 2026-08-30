import { Mermaid } from "nextra/components";
import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { CollectiveDocsSection } from "./components/home/CollectiveDocsSection";
import { HeroSection } from "./components/home/HeroSection";
import { ProjectCardsSection } from "./components/home/ProjectCardsSection";
import { QuickLinksSection } from "./components/home/QuickLinksSection";
import { ProjectList } from "./components/ProjectList";
import {
  CardHover,
  SectionReveal,
  StaggerContainer,
  StaggerItem,
} from "./components/ui/motion";
import { WhitepaperMetaInline } from "./components/WhitepaperMeta";

// Get the default MDX components
const themeComponents = getThemeComponents();

// H1 override: render the theme's normal H1, then render whitepaper metadata
// (proposer / status / review window) directly below it when present.
// On non-whitepaper pages there is no metadata context, so nothing is added.
function H1WithMeta(props) {
  const ThemeH1 = themeComponents.h1 ?? "h1";
  return (
    <>
      <ThemeH1 {...props} />
      <WhitepaperMetaInline />
    </>
  );
}

// Merge components
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    h1: H1WithMeta,
    // Nextra's remark pipeline rewrites ```mermaid fences into <Mermaid /> but
    // the docs theme does not supply the component, so every page must provide
    // it or prerendering throws "Expected component `Mermaid` to be defined".
    // Project docs are fetched from their own repos at build time, so any repo
    // adding a mermaid diagram would otherwise break this build.
    Mermaid,
    ProjectList,
    HeroSection,
    QuickLinksSection,
    ProjectCardsSection,
    CollectiveDocsSection,
    SectionReveal,
    StaggerContainer,
    StaggerItem,
    CardHover,
    ...components,
  };
}
