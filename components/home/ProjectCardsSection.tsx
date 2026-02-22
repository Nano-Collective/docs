import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAllProjects } from "@/lib/projects";

export function ProjectCardsSection() {
  const projects = getAllProjects();

  return (
    <section id="projects" className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-16 text-center text-2xl font-bold md:text-3xl">
          Nano Projects
        </h2>
        <div className="flex flex-col gap-6">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className={`card-hover-glow animate-on-scroll animate-delay-${(index + 1) * 100} flex sm:flex-row p-0! overflow-hidden`}
            >
              <div className="bg-muted flex flex-1 justify-center align-center w-full sm:w-1/2 px-4 pt-8 sm:p-6">
                <h3 className="text-center text-xl font-semibold py-0! my-auto!">
                  {project.name}
                </h3>
              </div>
              <div className="flex flex-col gap-9 w-full sm:w-1/2 px-4 pb-8 sm:p-9">
                <p className="text-muted-foreground text-center sm:text-left sm:max-w-xs">
                  {project.description}
                </p>
                <div className="flex justify-center sm:justify-start gap-3">
                  <Button asChild variant="default" size="sm">
                    <Link href={`/${project.id}`}>Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${project.id}/docs`}>Open Docs</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
