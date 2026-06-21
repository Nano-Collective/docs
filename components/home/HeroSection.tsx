"use client";

import AsciiWebsiteBackgroundGenerated from "@/components/home/AsciiWebsiteBackgroundGenerated";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[70vh]">
      {/* ASCII Video Background - forcefully scaled to cover the entire width and height */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden flex items-center justify-center">
        <div 
          className="relative flex items-center justify-center"
          style={{ 
            width: "1872px", 
            height: "425px",
            transform: "scale(max(100vw / 1872, 150vh / 425))", 
            transformOrigin: "center center",
          }}
        >
          <AsciiWebsiteBackgroundGenerated />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-24 sm:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-block animate-on-scroll">
            <span className="font-mono text-sm font-bold text-[#0000EE] dark:text-[#A1A1AA]">
              [ docs ]
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground animate-on-scroll animate-delay-100">
            Nano Docs
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-on-scroll animate-delay-200">
            Official documentation for Nano Collective projects. Find guides,
            API references, and examples to help you build with our tools.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-on-scroll animate-delay-300">
            <a
              href="https://github.com/Nano-Collective"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center bg-[#0000EE] dark:bg-foreground px-8 text-sm font-semibold tracking-wide text-white dark:text-background transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground w-full sm:w-auto group"
            >
              <span className="mr-3 font-bold text-white dark:text-background transition-colors">&gt;</span> 
              View on GitHub
            </a>
            <a
              href="https://nanocollective.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center border border-foreground/20 bg-transparent px-8 text-sm font-semibold tracking-wide text-foreground transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black w-full sm:w-auto group"
            >
              <span className="mr-3 font-bold text-[#0000EE] dark:text-[#A1A1AA] transition-colors">&gt;</span>
              Main Website
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
