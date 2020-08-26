import React, { isValidElement, createElement } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { useAuthState } from '../hooks'

/**
 * Redirect to home when user logged in
 *
 */
export default function GuestRoute({
  children,
  component,
  render,
  spinner = null,
  redirectTo = '/',
  redirectToReferrer = true,
  ...rest
}) {
  const { authenticated, bootstrappedAuth } = useAuthState()
  return (
    <Route
      {...rest}
      render={(props) => {
        if (authenticated) {
          // Redirect to referrer location
          const { location } = props
          if (redirectToReferrer && location.state && location.state.referrer) {
            return (
              <Redirect
                to={
                  typeof redirectTo === 'string'
                    ? location.state.referrer
                    : // If redirectTo is an object merged the state
                      // of location to redirect....
                      {
                        ...location.state.referrer,
                        state: {
                          ...redirectTo.state,
                          ...location.state.referrer.state,
                        },
                      }
                }
              />
            )
          }

          return <Redirect to={redirectTo} />
        }

        if (!bootstrappedAuth) {
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
