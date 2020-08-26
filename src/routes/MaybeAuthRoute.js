import React, { isValidElement, createElement } from 'react'
import { Route } from 'react-router-dom'
import { useAuthState } from '../hooks'

/**
 * Wait for auth loading before rendering route component
 * (needed for first time local storage auth...)
 *
 */
export default function MaybeAuthRoute({
  children,
  component,
  render,
  spinner = null,
  ...rest
}) {
  const { bootstrappedAuth, loginLoading } = useAuthState()
  return (
    <Route
      {...rest}
      render={(props) => {
        if (!bootstrappedAuth || loginLoading) {
          // Spinner as element as component or null
          return spinner
            ? isValidElement(spinner)
              ? spinner
              : createElement(spinner)
            : null
        }
        // Render as a Route
        return children
          ? children
          : component
          ? createElement(component, props)
          : render(props)
      }}
    />
  )
}
