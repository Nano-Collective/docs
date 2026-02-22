import { Book, Code, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const quickLinks = [
  {
    title: "Getting Started",
    description: "Learn the basics and get up and running quickly",
    icon: Book,
    href: "/nanocoder/docs/latest",
  },
  {
    title: "API Reference",
    description: "Detailed documentation for all APIs and interfaces",
    icon: Code,
    href: "/nanocoder/api-reference/latest",
  },
  {
    title: "Examples",
    description: "Real-world examples and use cases to inspire your projects",
    icon: Lightbulb,
    href: "/nanocoder/docs/latest",
  },
];

export function QuickLinksSection() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
          Quick Links
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {quickLinks.map((link, index) => (
            <Link key={link.title} href={link.href} className="group">
              <Card
                className={`card-hover-glow h-full animate-on-scroll animate-delay-${(index + 1) * 100}`}
              >
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <link.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {link.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
