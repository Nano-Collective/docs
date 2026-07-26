import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-foreground/20 bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row justify-between gap-12 lg:gap-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-bold text-2xl tracking-tight flex items-center gap-2 text-foreground mb-4"
            >
              Nano Collective
            </Link>
            <p className="text-sm text-foreground/70 font-mono leading-relaxed">
              Open-source AI tools built for developers. Privacy-first,
              local-first.
            </p>
          </div>
          <div className="grid grid-cols-2 md:flex md:flex-row gap-x-8 gap-y-12 sm:gap-16 lg:gap-24">
            <div className="min-w-[140px]">
              <h4 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
                Products
              </h4>
              <ul className="space-y-3 font-mono text-sm text-foreground/70">
                <li>
                  <a
                    href="https://nanocollective.org/nanocoder"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Nanocoder
                  </a>
                </li>
                <li>
                  <a
                    href="https://nanocollective.org/nanotune"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Nanotune
                  </a>
                </li>
                <li>
                  <a
                    href="https://nanocollective.org/sentinel"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Sentinel
                    <span className="text-[10px] uppercase tracking-widest text-foreground/50">
                      alpha
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Nano-Collective/get-md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    get-md
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Nano-Collective/json-up"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    json-up
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Nano-Collective/prompt-scrubber"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    prompt-scrub
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-[140px]">
              <h4 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
                Community
              </h4>
              <ul className="space-y-3 font-mono text-sm text-foreground/70">
                <li>
                  <a
                    href="https://nanocollective.org/contributors"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Contributors
                  </a>
                </li>

                <li>
                  <a
                    href="https://discord.gg/ktPDV6rekE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Nano-Collective"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            <div className="min-w-[100px]">
              <h4 className="font-bold text-sm text-foreground mb-4 font-mono tracking-wide uppercase border-b border-foreground/20 pb-2 inline-block">
                Resources
              </h4>
              <ul className="space-y-3 font-mono text-sm text-foreground/70">
                <li>
                  <a
                    href="https://nanocollective.org/blog"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="https://nanocollective.org/growth"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Growth
                  </a>
                </li>
                <li>
                  <a
                    href="https://nanocollective.org/sponsor"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Sponsor
                  </a>
                </li>
                <li>
                  <a
                    href="https://nanocollective.org/pipeline"
                    className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors flex items-center gap-2 group"
                  >
                    <span className="text-[#0000EE] dark:text-[#A1A1AA] opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">
                      &gt;
                    </span>
                    Build
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-foreground/60 font-mono">
          <p>
            © {new Date().getFullYear()} Nano Collective. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="https://nanocollective.org/privacy"
              className="hover:text-[#0000EE] dark:hover:text-[#A1A1AA] transition-colors"
            >
              [ Privacy ]
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
