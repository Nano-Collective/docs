import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

import { getApps, getLibraries } from "@/lib/projects";
import { Button } from "../ui/button";

const projectGradients: Record<string, string> = {
  nanocoder: "from-[#7aa2f7] to-[#bb9af7]",
  nanotune: "from-[#7dcfff] to-[#9ece6a]",
  "get-md": "from-[#565f89] to-[#414868]",
  "json-up": "from-[#ff9e64] to-[#f7768e]",
};

function ProjectCard({
  project,
  variant = "default",
}: {
  project: ReturnType<typeof getApps>[number];
  variant?: "default" | "compact";
}) {
  const isProject = variant === "default";
  const gradient = projectGradients[project.id] || "from-gray-600 to-gray-500";

  return (
    <div className="group overflow-hidden rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
      {isProject ? (
        /* Project card with gradient hero */
        <div className="flex flex-col sm:flex-row">
          <div
            className={`w-full sm:w-1/2 min-h-[180px] bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-8 relative overflow-hidden`}
          >
            <div className="absolute inset-0 opacity-30" />
            <div className="relative z-10 text-center">
              <h3 className="text-2xl font-bold text-white">{project.name}</h3>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full sm:w-1/2 p-8 bg-card">
            <p className="text-muted-foreground text-lg">
              {project.description}
            </p>
            <div className="flex gap-3 mt-auto">
              <Button asChild className="group/btn">
                <Link href={`/${project.id}/docs`}>
                  View Docs
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/${project.id}`}>Home</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Library card - compact style */
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">{project.name}</h3>
          </div>
          <p className="text-muted-foreground text-sm">{project.description}</p>
          <div className="flex gap-3 mt-auto">
            <Button asChild variant="default" size="sm">
              <Link href={`/${project.id}/docs`}>Docs</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/${project.id}`}>Home</Link>
            </Button>
          </div>
        </div>
      )}
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
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Nano Projects</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Full-fledged applications to boost your development workflow
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
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">Nano Libraries</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Lightweight utilities to integrate into your projects
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
