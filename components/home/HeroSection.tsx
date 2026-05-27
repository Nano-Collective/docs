"use client";

import { BookOpen, ExternalLink, GitBranch } from "lucide-react";
import { EffectScene } from "@/components/home/EffectScene";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[70vh]">
      {/* ASCII Video Background - full screen absolute */}
      <div className="absolute inset-0" style={{ minHeight: "70vh" }}>
        <EffectScene />
      </div>

      {/* Gradient overlays - uses hero-overlay class */}
      <div className="absolute inset-0 pointer-events-none hero-overlay" />

      {/* Content */}
      <div className="container mx-auto px-4 py-24 sm:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-block animate-on-scroll">
            <Badge
              variant="secondary"
              className="mb-4 text-sm px-4 py-1.5 bg-background/80 backdrop-blur-sm"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent animate-on-scroll animate-delay-100">
            Nano Docs
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-on-scroll animate-delay-200">
            Official documentation for Nano Collective projects. Find guides,
            API references, and examples to help you build with our tools.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-on-scroll animate-delay-300">
            <Button
              size="lg"
              className="group text-base w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
            >
              <a
                href="https://github.com/Nano-Collective"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitBranch className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                View on GitHub
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="group text-base w-full sm:w-auto"
              asChild
            >
              <a
                href="https://nanocollective.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Main Website
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
