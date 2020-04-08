import { useRef } from 'react'

// https://github.com/Andarist/use-constant/blob/master/src/index.ts
export function useConstant(fn) {
  const ref = useRef()

  if (!ref.current) {
    ref.current = { v: fn() }
  }

  return ref.current.v
}
