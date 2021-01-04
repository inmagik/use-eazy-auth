import { ComponentType, createContext, ReactNode } from 'react'
import { Location } from 'history'
import { Dictionary } from './types'

export interface AuthRoutesConfig<U = any> {
  guestRedirectTo?: string | Location<Dictionary>
  authRedirectTo?: string | Location<Dictionary>
  authRedirectTest?: (user: U) => string | null | undefined | Location
  spinner?: ReactNode
  spinnerComponent?: ComponentType
  rememberReferrer?: boolean
  redirectToReferrer?: boolean
}

const AuthRoutesContext = createContext<AuthRoutesConfig>({})

export default AuthRoutesContext
