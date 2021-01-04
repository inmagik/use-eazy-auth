import { useEffect, useRef } from 'react'
import { shallowEqualObjects } from './utils'

export default function useShallowMemo<V>(next: V) : V {
  const previousRef = useRef<V>(next)
  const previous = previousRef.current

  const isEqual = shallowEqualObjects(previous, next)

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next
    }
  })

  return isEqual ? previous : next
}
