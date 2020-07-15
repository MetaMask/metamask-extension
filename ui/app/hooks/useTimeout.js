import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useTimeout
 *
 * @param {Function}  cb   - callback function inside setTimeout
 * @param {number}  delay   - delay in ms
 * @param {boolean}  immediate   - delay in ms
 *
 * @return {Function}
 */
export function useTimeout (cb, delay, immediate = true) {
  const saveCb = useRef()
  const [triggered, setTriggered] = useState(immediate)

  useEffect(() => {
    saveCb.current = cb
  }, [cb])

  useEffect(() => {
    if (!triggered) {
      return
    }

    const id = setTimeout(() => {
      setTriggered(false)
      saveCb.current()
    }, delay)

    return () => {
      clearTimeout(id)
    }
  }, [delay, triggered])

  const trigger = useCallback(() => {
    setTriggered(true)
  }, [])

  return trigger
}
