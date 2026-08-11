import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * Whether the viewport is narrower than the `md` breakpoint.
 *
 * Returns `false` on the server and for the first client render, then settles
 * once mounted — reading `window` during render would break SSR, and guessing
 * mobile up front would flash the wrong control on every desktop load.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isMobile
}
