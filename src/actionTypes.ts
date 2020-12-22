import { AuthTokens } from './types'

export const BOOTSTRAP_AUTH_START = 'BOOTSTRAP_AUTH_START'
export const BOOTSTRAP_AUTH_END = 'BOOTSTRAP_AUTH_END'

export const LOGIN_LOADING = 'LOGIN_LOADING'
export const LOGIN_FAILURE = 'LOGIN_FAILURE'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'

export const CLEAR_LOGIN_ERROR = 'CLEAR_LOGIN_ERROR'

export const LOGOUT = 'LOGOUT'

export const TOKEN_REFRESHING = 'TOKEN_REFRESHING'
export const TOKEN_REFRESHED = 'TOKEN_REFRESHED'

export const UPDATE_USER = 'UPDATE_USER'

export const PATCH_USER = 'PATCH_USER'

export const SET_TOKENS = 'SET_TOKENS'

export type EndBootPayload =
  | {
      authenticated: false
    }
  | (AuthTokens & {
      user: any
      authenticated: true
    })

export interface TokenRefreshedAction {
  type: typeof TOKEN_REFRESHED
  payload: AuthTokens
}

export interface LogoutAction {
  type: typeof LOGOUT
}

export interface TokenRefreshingAction {
  type: typeof TOKEN_REFRESHING
}

export type FunctionalUpdaterUser<U> = (user: U | null) => U | null

// NOTE: Action collection 4 reducer
export type AuthActions<A = any, R = any, U = any> =
  | {
      type: typeof LOGIN_LOADING
    }
  | {
      type: typeof LOGIN_FAILURE
      error: any
    }
  | {
      type: typeof LOGIN_SUCCESS
      payload: AuthTokens<A, R> & {
        user: U
      }
    }
  | {
      type: typeof CLEAR_LOGIN_ERROR
    }
  | {
      type: typeof BOOTSTRAP_AUTH_START
    }
  | {
      type: typeof BOOTSTRAP_AUTH_END
      payload: EndBootPayload
    }
  | {
      type: typeof SET_TOKENS
      payload: AuthTokens
    }
  | TokenRefreshedAction
  | {
      type: typeof UPDATE_USER
      payload: FunctionalUpdaterUser<U> | U | null
    }
  | {
      type: typeof PATCH_USER
      payload: Partial<U>
    }
  | LogoutAction
