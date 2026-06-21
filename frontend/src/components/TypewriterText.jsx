import { useState, useEffect } from 'react'

export default function TypewriterText({
  text = '',
  animate = true,
  onComplete,
  onProgress,
}) {
  const [displayed, setDisplayed] = useState(animate ? '' : text)
  const typing = animate && displayed.length < text.length

  useEffect(() => {
    if (!text) {
      setDisplayed('')
      return
    }

    if (!animate) {
      setDisplayed(text)
      onComplete?.()
      return
    }

    setDisplayed('')
    let index = 0
    const step = text.length > 600 ? 2 : 1
    const ms = text.length > 600 ? 12 : 18

    const id = setInterval(() => {
      index = Math.min(index + step, text.length)
      const next = text.slice(0, index)
      setDisplayed(next)
      onProgress?.()

      if (index >= text.length) {
        clearInterval(id)
        onComplete?.()
      }
    }, ms)

    return () => clearInterval(id)
  }, [text, animate])

  const lines = displayed.split('\n')
  const lastIndex = Math.max(lines.length - 1, 0)

  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {line}
          {typing && i === lastIndex && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-accent align-text-bottom"
            />
          )}
        </p>
      ))}
    </>
  )
}
