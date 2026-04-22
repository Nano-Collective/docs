import Link from "next/link";
import { FaDiscord, FaGithub, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export default function Footer() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full px-6 pb-8">
      <div className="text-center md:text-left">
        <h3 className="font-bold text-xl mb-2">Nano Collective</h3>
        <p className="text-sm text-muted-foreground mb-2 font-semibold">
          Building powerful, privacy-first AI tools for everyone.
        </p>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nano Collective.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <nav className="flex gap-4 text-sm">
          <Link
            href="https://nanocollective.org"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Main Website
          </Link>
        </nav>
        <div className="flex gap-4">
          <a
            href="https://discord.gg/nanocollective"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nano Collective on Discord"
            className="text-muted-foreground hover:text-foreground transition-colors group"
          >
            <FaDiscord className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </a>
          <a
            href="https://github.com/nanocollective"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nano Collective on GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors group"
          >
            <FaGithub className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </a>
          <a
            href="https://x.com/nanocollective"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nano Collective on X"
            className="text-muted-foreground hover:text-foreground transition-colors group"
          >
            <FaXTwitter className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          </a>
          <a
            href="https://www.linkedin.com/company/nano-collective/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nano Collective on LinkedIn"
            className="text-muted-foreground hover:text-foreground transition-colors group"
          >
            <FaLinkedin className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}
