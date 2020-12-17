// https://github.com/reduxjs/redux/blob/master/src/bindActionCreators.ts

import { Dispatch } from 'react'

type ActionCreator = (...args: any[]) => any

function bindActionCreator(
  actionCreator: ActionCreator,
  dispatch: Dispatch<any>
) {
  return function (this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args))
  }
}

export type ActionCreators = {
  [k: string]: ActionCreator
}

export default function bindActionCreators<A extends ActionCreators>(
  actionCreators: A,
  dispatch: Dispatch<any>
): A {
  const boundActionCreators = {} as Record<keyof A, any>
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
