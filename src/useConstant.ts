// Thanks 2 ma man @Andarist <3
// https://github.com/Andarist/use-constant
import { useRef } from 'react'

type ResultBox<T> = { v: T }

export default function useConstant<T>(fn: () => T): T {
  const ref = useRef<ResultBox<T>>()

  if (!ref.current) {
    ref.current = { v: fn() }
  }

  return ref.current.v
}