import React from 'react'
import { Route } from 'react-router-dom'
import { useAuthState } from '../hooks'

/**
 * Wait for auth loading before rendering route component
 * (needed for first time local storage auth...)
 *
 */
export default function MaybeAuthRoute({ component, spinner = null, ...rest }) {
  const { bootstrappedAuth, loginLoading } = useAuthState()
  return <Route
    {...rest}
    render={props => {
      if (!bootstrappedAuth || loginLoading) {
        // Show nothing or a cool loading spinner
        return spinner ? React.createElement(spinner) : null
      }
      // Always render route component
      return React.createElement(component, props)
    }}
  />
}
