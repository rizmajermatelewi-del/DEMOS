import { defineConfig } from 'vite'

// The headline wraps differently in a fallback font, so the above-the-fold fonts are preloaded.
const ABOVE_FOLD = /(archivo-latin(-ext)?-(400|800)|caveat-latin(-ext)?-600)-normal.*\.woff2$/

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
  plugins: [preloadFonts()],
  server: { port: 5184, strictPort: true },
})
