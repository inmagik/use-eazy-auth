import React, { createElement, ReactNode, ComponentType } from 'react'
import { Route, Redirect, RouteProps } from 'react-router-dom'
import { Location } from 'history'
import { useAuthState } from '../hooks'

type Dict = Record<string, any>

export type GuestRouteProps = {
  redirectTo?: string | Location<Dict>
  redirectToReferrer?: boolean
  spinner?: ReactNode
  spinnerComponent?: ComponentType
} & RouteProps

/**
 * Redirect to home when user logged in
 *
 */
export default function GuestRoute({
  children,
  component,
  render,
  spinner,
  spinnerComponent,
  redirectTo = '/',
  redirectToReferrer = true,
  ...rest
}: GuestRouteProps) {
  const { authenticated, bootstrappedAuth } = useAuthState()
  return (
    <Route
      {...rest}
      render={(props) => {
        if (authenticated) {
          // Redirect to referrer location
          const { location } = props as { location: Location<Dict> }
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
