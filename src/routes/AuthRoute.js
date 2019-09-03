import React, { useMemo } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { useAuthState, useAuthUser } from '../hooks'

const RedirectAuthRoute = React.memo(({
  component,
  spinner = null,
  redirectTo = '/login',
  rememberReferrer = true,
  userRedirectTo,
  authenticated,
  bootstrappedAuth,
  loginLoading,
  ...rest
}) => (
  <Route
    {...rest}
    render={props => {
      if (!bootstrappedAuth || loginLoading) {
        // Show nothing or a cool loading spinner
        return spinner ? React.createElement(spinner) : null
      }
      // User authenticated
      if (authenticated) {
        // Redirect a logged user?
        if (userRedirectTo) {
          return <Redirect to={userRedirectTo} />
        }
        // Render normal component
        return React.createElement(component, props)
      }
      // User not authenticated, redirect to login
      const to =
        typeof redirectTo === 'string'
          ? {
              pathname: redirectTo,
            }
          : redirectTo
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
))

/**
 * Ensure user logged otherwise redirect them to login
 *
 */
export default function AuthRoute({
  redirectTest,
  ...rest
}) {
  const { authenticated, bootstrappedAuth, loginLoading } = useAuthState()
  const { user } = useAuthUser()

  const userRedirectTo = useMemo(() => {
    if (user && typeof redirectTest === 'function') {
      const userRedirectTo = redirectTest(user)
      if (userRedirectTo) {
        return <Redirect to={userRedirectTo} />
      }
    }
    return null
  }, [user, redirectTest])

  return <RedirectAuthRoute
    userRedirectTo={userRedirectTo}
    authenticated={authenticated}
    bootstrappedAuth={bootstrappedAuth}
    loginLoading={loginLoading}
    {...rest}
  />
}
