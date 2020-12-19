import React, { useMemo, createElement, ReactNode, ComponentType } from 'react'
import { Route, Redirect, RouteProps } from 'react-router-dom'
import { Location } from 'history'
import { useAuthState, useAuthUser } from '../hooks'

export interface RedirectAuthRouteCheckProps {
  redirectTo?: string | Location
  spinner?: ReactNode
  spinnerComponent?: ComponentType
  rememberReferrer?: boolean
  userRedirectTo: string | null | Location
  authenticated: boolean
  bootstrappedAuth: boolean
  loginLoading: boolean
}

type RedirectAuthRouteProps = RedirectAuthRouteCheckProps & RouteProps

type Dict = Record<string, any>

const RedirectAuthRoute = React.memo(
  ({
    children,
    component,
    render,
    spinner,
    spinnerComponent,
    redirectTo = '/login',
    rememberReferrer = true,
    userRedirectTo,
    authenticated,
    bootstrappedAuth,
    loginLoading,
    ...rest
  }: RedirectAuthRouteProps) => (
    <Route
      {...rest}
      render={(props) => {
        if (!bootstrappedAuth || loginLoading) {
          // Spinner or Spinner Component
          return spinnerComponent
            ? createElement(spinnerComponent)
            : spinner ?? null
        }
        // User authenticated
        if (authenticated) {
          // Redirect a logged user?
          if (userRedirectTo) {
            return <Redirect to={userRedirectTo} />
          }
          // Render as a Route
          return children
            ? children
            : component
            ? createElement(component, props)
            : render
            ? render(props)
            : null
        }
        // User not authenticated, redirect to login
        const to: Location<Dict> = (typeof redirectTo === 'string'
          ? {
              pathname: redirectTo,
            }
          : redirectTo) as Location<Dict>
        return (
          <Redirect
            to={{
              ...to,
              state: {
                ...to.state,
                referrer:
                  // TODO: Handle logoutFromPermission when implemented 403 handling
                  // in eazy auth ....
                  rememberReferrer //&& !auth.logoutFromPermission
                    ? props.location
                    : undefined,
              },
            }}
          />
        )
      }}
    />
  )
)

export interface AuthRouteCheckProps<U = any> {
  redirectTest?: (user: U) => string | null | undefined | Location
  redirectTo?: string | Location
  spinner?: ReactNode
  spinnerComponent?: ComponentType
  rememberReferrer?: boolean
}

export type AuthRouteProps<U = any> = AuthRouteCheckProps<U> & RouteProps

/**
 * Ensure user logged otherwise redirect them to login
 *
 */
export default function AuthRoute({ redirectTest, ...rest }: AuthRouteProps) {
  const { authenticated, bootstrappedAuth, loginLoading } = useAuthState()
  const { user } = useAuthUser()

  const userRedirectTo = useMemo(() => {
    if (user && typeof redirectTest === 'function') {
      const userRedirectTo = redirectTest(user)
      if (userRedirectTo) {
        return userRedirectTo
      }
    }
    return null
  }, [user, redirectTest])

  // NOTE: split in two components is only an optimization
  // to avoid re-execute Route render when user changes but
  // the output of redirect test doesnt't change
  return (
    <RedirectAuthRoute
      userRedirectTo={userRedirectTo}
      authenticated={authenticated}
      bootstrappedAuth={bootstrappedAuth}
      loginLoading={loginLoading}
      {...rest}
    />
  )
}
