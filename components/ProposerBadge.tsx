import { Github } from "lucide-react";

interface ProposerBadgeProps {
  name: string;
  github?: string;
}

export function ProposerBadge({ name, github }: ProposerBadgeProps) {
  return (
    <span className="not-prose inline-flex items-center gap-2 text-sm text-[var(--x-color-fg-muted,#666)]">
      <span>Proposed by</span>
      {github ? (
        <a
          href={`https://github.com/${github}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-[var(--x-color-primary-600,#7aa2f7)] hover:underline"
        >
          {name}
          <Github className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      ) : (
        <span className="font-medium">{name}</span>
      )}
    </span>
  );
}
