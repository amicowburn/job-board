'use client'

import { useState, useEffect } from 'react'

export function BottomBlur() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const check = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      setVisible(distanceFromBottom > 100)
    }

    window.addEventListener('scroll', check, { passive: true })
    check()
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 pointer-events-none z-40 backdrop-blur-[3px] transition-opacity duration-500"
      style={{
        maskImage: 'linear-gradient(to top, black 20%, transparent)',
        WebkitMaskImage: 'linear-gradient(to top, black 20%, transparent)',
        opacity: visible ? 1 : 0,
      }}
    />
  )
}
