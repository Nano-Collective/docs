import Link from "next/link";

import { Card } from "@/components/ui/card";
import { getApps, getLibraries } from "@/lib/projects";
import { Button } from "../ui/button";

function ProjectCard({
  project,
  index,
  variant = "default",
}: {
  project: ReturnType<typeof getApps>[number];
  index: number;
  variant?: "default" | "compact";
}) {
  const isProject = variant === "default";

  return (
    <Card
      className={`card-hover-glow animate-on-scroll animate-delay-${(index + 1) * 100} flex ${
        isProject ? "sm:flex-row" : ""
      } p-0! overflow-hidden`}
    >
      {isProject && (
        <div className="bg-muted flex flex-1 justify-center align-center w-full sm:w-1/2 px-4 pt-8 sm:p-6 min-h-[180px]">
          <h3 className="text-center text-xl font-semibold py-0! my-auto!">
            {project.name}
          </h3>
        </div>
      )}
      <div
        className={`flex flex-col gap-9 w-full ${
          isProject ? "sm:w-1/2" : ""
        } px-4 pb-8 sm:p-9`}
      >
        {variant === "compact" && (
          <h3 className="text-lg font-semibold">{project.name}</h3>
        )}
        <p className="text-muted-foreground text-center sm:text-left sm:max-w-xs">
          {project.description}
        </p>
        <div className="flex justify-center sm:justify-start gap-3">
          <Button asChild variant="default" size="sm">
            <Link href={`/${project.id}`}>
              {isProject ? "Get Started" : "Install"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/${project.id}/docs`}>Open Docs</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ProjectCardsSection() {
  const apps = getApps();
  const libraries = getLibraries();

  return (
    <section id="projects" className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Projects Section - Full-width cards with visual hero */}
        {apps.length > 0 && (
          <>
            <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
              Nano Projects
            </h2>
            <p className="mb-12 text-center text-muted-foreground">
              Full-fledged applications to boost your development workflow
            </p>
            <div className="flex flex-col gap-6 mb-16">
              {apps.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  variant="default"
                />
              ))}
            </div>
          </>
        )}

        {/* Libraries Section - Compact cards */}
        {libraries.length > 0 && (
          <>
            <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
              Nano Libraries
            </h2>
            <p className="mb-12 text-center text-muted-foreground">
              Lightweight libraries to integrate into your projects
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {libraries.map((library, index) => (
                <ProjectCard
                  key={library.id}
                  project={library}
                  index={index}
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
