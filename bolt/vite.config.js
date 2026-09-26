import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The condensed headline wraps very differently in a fallback font, so the
// fonts used above the fold are preloaded to keep the layout from jumping.
const ABOVE_FOLD = /(barlow-condensed-latin(-ext)?-800|space-grotesk-latin(-ext)?-(400|600))-normal.*\.woff2$/

function preloadFonts() {
  return {
    name: 'preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle ?? {})
          .filter((file) => ABOVE_FOLD.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head',
          }))
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), preloadFonts()],
  server: { port: 5179, strictPort: true },
})
