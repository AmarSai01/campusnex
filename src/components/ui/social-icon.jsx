import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Round icon links for social profiles, built on the shared Button (asChild → <a>).
// Brand marks are inline SVGs (Simple Icons shapes), so nothing loads from another site.
const ICONS = {
  linkedin: (
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  ),
  github: (
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  ),
  x: (
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  ),
  instagram: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="17.6" cy="6.4" r="1.4" />
    </>
  ),
}

const LABELS = { linkedin: "LinkedIn", github: "GitHub", x: "X", instagram: "Instagram" }

export function SocialIcons({ links, name, className }) {
  const items = links.filter((l) => l.href && ICONS[l.network])
  if (!items.length) return null
  return (
    <ul className={cn("flex flex-wrap items-center gap-3", className)}>
      {items.map(({ network, href }) => (
        <li key={network}>
          <Button
            asChild
            variant="outline"
            size="icon"
            className={cn(
              "size-11 rounded-full border-white/15 bg-white/[0.04] text-white/85 dark:border-white/15 dark:bg-white/[0.04]",
              "transition-all duration-300 hover:scale-120 hover:border-brand-500/60 hover:bg-brand-500/10 hover:text-brand-300 hover:shadow-[0_8px_24px_-8px_rgba(255,92,0,0.6)]",
              "focus-visible:ring-brand-500/60 motion-reduce:transition-colors motion-reduce:hover:scale-100",
            )}
          >
            <a href={href} target="_blank" rel="noreferrer" aria-label={`${name} on ${LABELS[network]} (opens in a new tab)`}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-[18px]">
                {ICONS[network]}
              </svg>
            </a>
          </Button>
        </li>
      ))}
    </ul>
  )
}

export default SocialIcons
