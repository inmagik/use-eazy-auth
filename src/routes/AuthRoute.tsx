import React, {
  ComponentType,
  createElement,
  ReactNode,
  useContext,
  useMemo,
} from 'react'
import { Redirect, Route, RouteProps } from 'react-router-dom'
import { Location } from 'history'
import { useAuthState, useAuthUser } from '../hooks'
import AuthRoutesContext from './AuthRoutesContext'
import { Dictionary } from './types'

type RedirectAuthRouteProps = {
  redirectTo?: string | Location
  spinner?: ReactNode
  spinnerComponent?: ComponentType
  rememberReferrer?: boolean
  userRedirectTo: string | null | Location
  authenticated: boolean
  bootstrappedAuth: boolean
  loginLoading: boolean
} & RouteProps

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
        const to: Location<Dictionary> = (typeof redirectTo === 'string'
          ? {
              pathname: redirectTo,
            }
          : redirectTo) as Location<Dictionary>
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

export type AuthRouteProps<U = any> = {
  redirectTest?: null | ((user: U) => string | null | undefined | Location)
  redirectTo?: string | Location
  spinner?: ReactNode
  spinnerComponent?: ComponentType
  rememberReferrer?: boolean
} & RouteProps

/**
 * Ensure user logged otherwise redirect them to login
 *
 */
export default function AuthRoute({
  redirectTest: localRedirectTest,
  redirectTo: localRedirectTo,
  spinner: localSpinner,
  spinnerComponent: localSpinnerComponent,
  rememberReferrer: localRememberReferrer,
  ...rest
}: AuthRouteProps) {
  const routesCtxConfig = useContext(AuthRoutesContext)
  const spinner =
    localSpinner === undefined ? routesCtxConfig.spinner : localSpinner
  const spinnerComponent =
    localSpinnerComponent ?? routesCtxConfig.spinnerComponent
  const redirectTo = localRedirectTo ?? routesCtxConfig.authRedirectTo
  const rememberReferrer =
    localRememberReferrer ?? routesCtxConfig.rememberReferrer
  const redirectTest =
    localRedirectTest === undefined
      ? routesCtxConfig.authRedirectTest
      : localRedirectTest

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
      redirectTo={redirectTo}
      spinner={spinner}
      spinnerComponent={spinnerComponent}
      rememberReferrer={rememberReferrer}
      {...rest}
    />
  )
}
