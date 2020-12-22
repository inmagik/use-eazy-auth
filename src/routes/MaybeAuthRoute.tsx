import React, { createElement, ReactNode, ComponentType } from 'react'
import { Route, RouteProps } from 'react-router-dom'
import { useAuthState } from '../hooks'

export type MaybeAuthRouteProps = {
  spinner?: ReactNode
  spinnerComponent?: ComponentType
} & RouteProps

/**
 * Wait for auth loading before rendering route component
 * (needed for first time local storage auth...)
 *
 */
export default function MaybeAuthRoute({
  children,
  component,
  render,
  spinner,
  spinnerComponent,
  ...rest
}: MaybeAuthRouteProps) {
  const { bootstrappedAuth, loginLoading } = useAuthState()
  return (
    <Route
      {...rest}
      render={(props) => {
        if (!bootstrappedAuth || loginLoading) {
          // Spinner as element as component or null
          return spinnerComponent
            ? createElement(spinnerComponent)
            : spinner ?? null
        }
        // Render as a Route
        return children
          ? children
          : component
          ? createElement(component, props)
          : render
          ? render(props)
          : null
      }}
    />
  )
}
