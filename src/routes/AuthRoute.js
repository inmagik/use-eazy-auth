import React, { useMemo, isValidElement, createElement } from 'react'
import { Route, Redirect } from 'react-router-dom'
import { useAuthState, useAuthUser } from '../hooks'

const RedirectAuthRoute = React.memo(
  ({
    children,
    component,
    render,
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
      render={(props) => {
        if (!bootstrappedAuth || loginLoading) {
          // Spinner as element as component or null
          return spinner
            ? isValidElement(spinner)
              ? spinner
              : createElement(spinner)
            : null
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
            : render(props)
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
  )
)

/**
 * Ensure user logged otherwise redirect them to login
 *
 */
export default function AuthRoute({ redirectTest, ...rest }) {
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
