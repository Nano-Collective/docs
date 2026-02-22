import Link from "next/link";
import { getAllProjects } from "@/lib/projects";

export function ProjectList() {
	const projects = getAllProjects();

	return (
		<div className="not-prose grid gap-4 sm:grid-cols-2 py-12">
			{projects.map((project) => (
				<Link
					key={project.id}
					href={`/${project.id}`}
					className="group rounded-lg border border-border p-4 transition-all hover:border-primary/50 hover:bg-muted/50 dark:hover:border-primary/60 dark:hover:bg-muted"
				>
					<h3 className="font-semibold group-hover:underline text-foreground">
						{project.name}
					</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						{project.repo.owner}/{project.repo.name}
					</p>
				</Link>
			))}
		</div>
	);
}
