import React, { ReactNode } from 'react'
import AuthRoutesContext, { AuthRoutesConfig } from './AuthRoutesContext'
import useShallowMemo from './useShallowMemo'

export type AuthRoutesConfigProps = {
  children: ReactNode
} & AuthRoutesConfig

export default function AuthRoutesProvider({
  children,
  ...props
}: AuthRoutesConfigProps) {
  const ctxValue = useShallowMemo(props)

  return (
    <AuthRoutesContext.Provider value={ctxValue}>
      {children}
    </AuthRoutesContext.Provider>
  )
}
