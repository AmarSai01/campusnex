import { useEffect } from 'react'
import 'lenis/dist/lenis.css'

// Smooth scrolling for marketing pages. Lenis drives the scroll, GSAP's ticker drives Lenis,
// and ScrollTrigger reads Lenis's position so pinned and scrubbed sections stay in sync.
// Framer Motion's useScroll reads the native scroll position, which Lenis keeps updated.
// Lenis and GSAP are loaded after the first paint so they don't delay the page appearing.
// Skipped entirely when the visitor prefers reduced motion.
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let cleanup = () => {}
    let cancelled = false

    Promise.all([import('lenis'), import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ default: Lenis }, { gsap }, { ScrollTrigger }]) => {
        if (cancelled) return
        gsap.registerPlugin(ScrollTrigger)

        const lenis = new Lenis({ duration: 1.1, anchors: { offset: -72 }, autoRaf: false })
        lenis.on('scroll', ScrollTrigger.update)

        const tick = (time) => lenis.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)

        // Keep Lenis in step with the real page. The browser can restore a scroll position
        // after load, and pinned sections add scroll length after Lenis first measures; if
        // Lenis kept its old numbers, the next wheel scroll would drag the page backwards.
        const sync = () => {
          lenis.resize()
          if (!lenis.isScrolling) lenis.scrollTo(window.scrollY, { immediate: true, force: true })
        }
        const onNativeScroll = () => {
          if (!lenis.isScrolling && Math.abs(window.scrollY - lenis.scroll) > 2) sync()
        }
        ScrollTrigger.addEventListener('refresh', sync)
        window.addEventListener('load', sync)
        window.addEventListener('scroll', onNativeScroll, { passive: true })
        const settle = setTimeout(sync, 300)

        cleanup = () => {
          clearTimeout(settle)
          gsap.ticker.remove(tick)
          ScrollTrigger.removeEventListener('refresh', sync)
          window.removeEventListener('load', sync)
          window.removeEventListener('scroll', onNativeScroll)
          lenis.destroy()
        }
      }
    )

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return children
}
