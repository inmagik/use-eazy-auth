import React, {
  ComponentType,
  createElement,
  ReactNode,
  useContext,
} from 'react'
import { Redirect, Route, RouteProps } from 'react-router-dom'
import { Location } from 'history'
import { useAuthState } from '../hooks'
import AuthRoutesContext from './AuthRoutesContext'
import { Dictionary } from './types'

export type GuestRouteProps = {
  redirectTo?: string | Location<Dictionary>
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
  spinner: localSpinner,
  spinnerComponent: localSpinnerComponent,
  redirectTo: localRedirectTo,
  redirectToReferrer: localRedirectToReferrer,
  ...rest
}: GuestRouteProps) {
  const routesCtxConfig = useContext(AuthRoutesContext)
  const spinner =
    localSpinner === undefined ? routesCtxConfig.spinner : localSpinner
  const spinnerComponent =
    localSpinnerComponent ?? routesCtxConfig.spinnerComponent
  const redirectTo = localRedirectTo ?? routesCtxConfig.guestRedirectTo ?? '/'
  const redirectToReferrer =
    localRedirectToReferrer ?? routesCtxConfig.redirectToReferrer ?? true

  const { authenticated, bootstrappedAuth } = useAuthState()
  return (
    <Route
      {...rest}
      render={(props) => {
        if (authenticated) {
          // Redirect to referrer location
          const { location } = props as { location: Location<Dictionary> }
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
