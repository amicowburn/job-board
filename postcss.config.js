/**
 * Tailwind v4 moves the PostCSS integration into its own package; the bare
 * `tailwindcss` plugin entry is a v3 shape and errors under v4. Autoprefixer is
 * gone because v4 handles vendor prefixing itself.
 */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
