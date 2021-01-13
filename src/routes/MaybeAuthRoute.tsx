import React, { ComponentType, createElement, ReactNode, useContext } from 'react'
import { Route, RouteProps } from 'react-router-dom'
import { useAuthState } from '../hooks'
import AuthRoutesContext from './AuthRoutesContext'

export type MaybeAuthRouteProps = {
  spinner?: ReactNode
  spinnerComponent?: ComponentType
} & RouteProps

/**
 * Wrapper around `<Route />`, render given spinner or null while auth is loading
 * then render given content for both guest and authenticated user.
 *
 */
export default function MaybeAuthRoute({
  children,
  component,
  render,
  spinner: localSpinner,
  spinnerComponent: localSpinnerComponent,
  ...rest
}: MaybeAuthRouteProps) {
  const routesCtxConfig = useContext(AuthRoutesContext)
  const spinner =
    localSpinner === undefined ? routesCtxConfig.spinner : localSpinner
  const spinnerComponent =
    localSpinnerComponent ?? routesCtxConfig.spinnerComponent

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
