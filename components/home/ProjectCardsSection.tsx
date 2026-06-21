import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";



import { getApps, getLibraries } from "@/lib/projects";

function ProjectCard({
  project,
  variant = "default",
}: {
  project: ReturnType<typeof getApps>[number];
  variant?: "default" | "compact";
}) {
  const isProject = variant === "default";
  const tag = isProject ? "[ app ]" : "[ pkg ]";
  
  const exploreHref = isProject 
    ? `https://nanocollective.org/${project.id}` 
    : `https://github.com/Nano-Collective/${project.id}`;
    
  const exploreText = isProject 
    ? `Explore ${project.name}` 
    : `View on GitHub`;

  return (
    <div className="bg-background border border-foreground/20 p-8 group hover:bg-muted transition-all hover:shadow-lg dark:hover:shadow-[0_4px_20px_rgb(0,0,0,0.5)] hover:-translate-y-1 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs sm:text-sm font-bold text-[#0000EE] dark:text-[#A1A1AA]">
              {tag}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">{project.name}</h3>
          </div>
        </div>
        <p className="text-sm sm:text-lg text-foreground/70 leading-relaxed mb-8 flex-grow">
          {project.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/${project.id}/docs`}
            className="inline-flex h-12 items-center justify-center bg-[#0000EE] dark:bg-foreground px-8 text-sm font-semibold tracking-wide text-white dark:text-background transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground w-full sm:w-auto group/btn"
          >
            <span className="mr-3 font-bold text-white dark:text-background transition-colors">&gt;</span> 
            View Docs
          </Link>
          <a
            href={exploreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center border border-foreground/20 bg-transparent px-8 text-sm font-semibold tracking-wide text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black w-full sm:w-auto group/btn"
          >
            <span className="mr-3 font-bold text-[#0000EE] dark:text-[#A1A1AA] transition-colors">&gt;</span>
            {exploreText}
          </a>
        </div>
      </div>
    </div>
  );
}

export function ProjectCardsSection() {
  const apps = getApps();
  const libraries = getLibraries();

  return (
    <section id="projects" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Projects Section */}
        {apps.length > 0 && (
          <>
            <div className="mb-8 sm:mb-16 border-b border-foreground/20 pb-4 sm:pb-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Nano Projects</h2>
              <p className="text-xs sm:text-lg text-foreground/70 font-mono">
                Full-fledged applications to boost your development workflow.
              </p>
            </div>
            <div className="flex flex-col gap-6 mb-16">
              {apps.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  variant="default"
                />
              ))}
            </div>
          </>
        )}

        {/* Libraries Section */}
        {libraries.length > 0 && (
          <>
            <div className="mb-8 sm:mb-16 border-b border-foreground/20 pb-4 sm:pb-8">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Nano Libraries</h2>
              <p className="text-xs sm:text-lg text-foreground/70 font-mono">
                Lightweight utilities to integrate into your projects.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {libraries.map((library) => (
                <ProjectCard
                  key={library.id}
                  project={library}
                  variant="compact"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
