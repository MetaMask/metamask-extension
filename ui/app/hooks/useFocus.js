import { useRef } from 'react'

/**
 * useFocus hook
 *
 * Creates and returns a react ref which can be passed to a component. Also returns a function that,
 * when called, will focus the component to which the ref was passed.
 * @return {[object, Function]}
 */
export function useFocus () {
  const htmlElRef = useRef(null)
  const setFocus = () => {
    if (htmlElRef.current) {
      htmlElRef.current.focus()
    }
  }

  return [ htmlElRef, setFocus ]
}
