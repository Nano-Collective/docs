import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { CollectiveDocsSection } from "./components/home/CollectiveDocsSection";
import { HeroSection } from "./components/home/HeroSection";
import { ProjectCardsSection } from "./components/home/ProjectCardsSection";
import { QuickLinksSection } from "./components/home/QuickLinksSection";
import { ProjectList } from "./components/ProjectList";
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
    ProjectList,
    HeroSection,
    QuickLinksSection,
    ProjectCardsSection,
    CollectiveDocsSection,
    ...components,
  };
}
