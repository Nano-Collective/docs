import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

export function CollectiveDocsSection() {
  return (
    <section id="collective" className="pt-16 pb-32 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="border-t border-border/50 mb-16" />
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">The Collective</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Operational documentation for the Nano Collective — the shared
            conventions, playbooks, and values behind every project.
          </p>
        </div>
        <div className="group overflow-hidden rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/2 min-h-[180px] bg-gradient-to-br from-[#bb9af7] to-[#7aa2f7] flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" />
              <div className="relative z-10 text-center">
                <h3 className="text-2xl font-bold text-white">
                  Nano Collective
                </h3>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full sm:w-1/2 p-8 bg-card">
              <p className="text-muted-foreground text-lg">
                How we work as a collective: repo and CI conventions, stack
                suggestions, community and contribution guidelines — everything
                that keeps projects consistent across the collective.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                <Button asChild className="group/btn w-full sm:w-auto">
                  <Link href="/collective">
                    View Docs
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
