import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useTimeout
 *
 * @param {Function}  cb   - callback function inside setTimeout
 * @param {number}  delay   - delay in ms
 * @param {boolean}  [immediate]   - determines whether the timeout is invoked immediately
 *
 * @return {Function|undefined}
 */
export function useTimeout(cb, delay, immediate = true) {
  const saveCb = useRef()
  const [timeoutId, setTimeoutId] = useState(null)

  useEffect(() => {
    saveCb.current = cb
  }, [cb])

  useEffect(() => {
    if (timeoutId !== 'start') {
      return undefined
    }

    const id = setTimeout(() => {
      saveCb.current()
    }, delay)

    setTimeoutId(id)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [delay, timeoutId])

  const startTimeout = useCallback(() => {
    clearTimeout(timeoutId)
    setTimeoutId('start')
  }, [timeoutId])

  if (immediate) {
    startTimeout()
  }

  return startTimeout
}
