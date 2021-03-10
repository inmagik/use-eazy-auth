import React, {
  Reducer,
  useCallback,
  createContext,
  useMemo,
  useEffect,
  useReducer,
  useRef,
  ReactNode,
} from 'react'
import { Observable, Subject } from 'rxjs'
import { makeStorage, StorageBackend } from './storage'
import useConstant from './useConstant'
import { bootAuth, makePerformLogin } from './authEffects'
import makeCallApiRx from './callApiRx'
// Reducer stuff
import authReducer, { AuthStateShape, initAuthState } from './reducer'
import bindActionCreators from './bindActionCreators'
import * as actionCreators from './actionCreators'
import {
  AuthActions,
  FunctionalUpdaterUser,
  LOGOUT,
  SET_TOKENS,
  BOOTSTRAP_AUTH_END,
  LOGIN_SUCCESS,
} from './actionTypes'
import {
  AuthTokens,
  InitialAuthData,
  CurryAuthApiFn,
  CurryAuthApiFnPromise,
  LoginCall,
  MeCall,
  RefreshTokenCall,
} from './types'

export interface AuthState {
  bootstrappedAuth: boolean
  authenticated: boolean
  loginLoading: boolean
  loginError: any
}

export interface AuthUser<U = any, A = any> {
  token: A | null
  user: U | null
}

export interface AuthActionCreators<A = any, R = any, U = any, C = any> {
  callAuthApiObservable<O>(
    apiFn: CurryAuthApiFn<A, O>,
    ...args: any[]
  ): Observable<O>

  callAuthApiPromise<O>(
    apiFn: CurryAuthApiFnPromise<A, O>,
    ...args: any[]
  ): Promise<O>

  updateUser(user: U | FunctionalUpdaterUser<U> | null): void

  patchUser(partialUser: Partial<U>): void

  clearLoginError(): void

  setTokens(authTokens: AuthTokens<A, R>): void

  login(loginCredentials: C): void

  logout(): void
}

// Declare Eazy Auth contexts
export const AuthStateContext = createContext<AuthState>(null as any)
export const AuthUserContext = createContext<AuthUser>(null as any)
export const AuthActionsContext = createContext<AuthActionCreators>(null as any)

interface AuthProps<A = any, R = any, U = any, C = any> {
  children?: ReactNode
  render?: (
    actions: AuthActionCreators<A, R, U, C>,
    authState: AuthState,
    authUser: AuthUser<U, A>
  ) => ReactNode
  loginCall: LoginCall<C, A, R>
  meCall: MeCall<A, U>
  refreshTokenCall?: RefreshTokenCall<A, R>
  storageBackend?: StorageBackend | false
  storageNamespace?: string
  initialData?: InitialAuthData<A, R, U>
  onLogout?: () => void
  onAuthenticate?: (user: U, accessToken: A, fromLogin: boolean) => void
}

export default function Auth<A = any, R = any, U = any, C = any>({
  children,
  render,
  loginCall,
  meCall,
  refreshTokenCall,
  storageBackend,
  storageNamespace = 'auth',
  initialData,
  onLogout,
  onAuthenticate,
}: AuthProps<A, R, U, C>) {
  // Init React Reducer
  const [state, originalDispatch] = useReducer<
    Reducer<AuthStateShape<A, R, U>, AuthActions>,
    InitialAuthData<A, R, U> | undefined
  >(authReducer, initialData, initAuthState)

  // Handle last onAuthenticate callback
  const autenticateCbRef = useRef(onAuthenticate)
  useEffect(() => {
    autenticateCbRef.current = onAuthenticate
  }, [onAuthenticate])

  // Handle last onLogout callback
  const logoutCbRef = useRef(onLogout)
  useEffect(() => {
    logoutCbRef.current = onLogout
  }, [onLogout])

  // Make storage from config
  // NOTE: Switch againg from useMemo storage is a constant fuck off
  const storage = useConstant(() =>
    makeStorage<A, R>(storageBackend, storageNamespace)
  )

  const {
    bootstrappedAuth,
    accessToken,
    refreshToken,
    expires,
    loginLoading,
    loginError,
  } = state

  // TODO: Check better strategy and future trouble \w async react
  // This trick is done because token can change over time Es:. the token was refresh
  // But the callApi function instance can't change because this can cause
  // re-running of other useEffect \w callApi as deps or break other
  // memoization ... plus this approch guarantee doesn't trigger re-render
  // of components thath subscribe only to auth actions context when token changes
  // SIDE NOTE
  // In a more idiomatic way at the ends an access token isn't important
  // for your rendering is only a detail implementation of how your
  // server rember who you are ... So if a token change isn't important for
  // rendering but is important for the (*future*) for side effects
  const tokenRef = useRef<AuthTokens<A, R> | null>(
    accessToken ? { accessToken, refreshToken, expires } : null
  )

  // Is authenticated when has an access token eazy
  // This line can't look stupid but is very very important
  const authenticated = !!accessToken

  // Handle the ref of booting status of eazy auth
  const bootRef = useRef(bootstrappedAuth)

  const [actionObservable, dispatch] = useConstant(() => {
    const actionSubject = new Subject<AuthActions>()
    const dispatch = (action: AuthActions) => {
      // Handle user callbacks
      if (action.type === BOOTSTRAP_AUTH_END && action.payload.authenticated) {
        const autenticateCb = autenticateCbRef.current
        if (autenticateCb) {
          autenticateCb(action.payload.user, action.payload.accessToken, false)
        }
      }
      if (action.type === LOGIN_SUCCESS) {
        const autenticateCb = autenticateCbRef.current
        if (autenticateCb) {
          autenticateCb(action.payload.user, action.payload.accessToken, true)
        }
      }
      if (action.type === LOGOUT) {
        // Clear token ref
        tokenRef.current = null
        // Call user callback
        const logoutCb = logoutCbRef.current
        if (logoutCb) {
          logoutCb()
        }
      }

      // Update React state reducer
      originalDispatch(action)
      // Next Observable
      actionSubject.next(action)

      // Remove tokens from storage
      // (after applying the new state cause can be slow)
      if (action.type === LOGOUT) {
        storage.removeTokens()
      }
    }
    return [actionSubject.asObservable(), dispatch]
  })

  // Boot Eazy Auth
  useEffect(() => {
    return bootAuth<A, R>(
      meCall,
      refreshTokenCall,
      storage,
      dispatch,
      tokenRef,
      bootRef
    )
  }, [dispatch, meCall, refreshTokenCall, storage])

  // ~~ Make Actions ~~~

  // Actions creator should't change between renders
  const boundActionCreators = useConstant(() =>
    bindActionCreators(actionCreators, dispatch)
  )

  const [performLogin, unsubscribeFromLogin] = useConstant(() =>
    makePerformLogin<A, R, U, C>(loginCall, meCall, storage, dispatch, tokenRef)
  )

  const login = useCallback(
    (loginCredentials: C) => {
      if (
        // Is eazy auth boostrapped?
        bootstrappedAuth &&
        // Is ma men alredy logged?
        !authenticated
      ) {
        performLogin(loginCredentials)
      }
    },
    [authenticated, bootstrappedAuth, performLogin]
  )

  const performLogout = useCallback(() => {
    // Trigger log out
    dispatch({ type: LOGOUT })
  }, [dispatch])

  const logout = useCallback(() => {
    if (tokenRef.current) {
      performLogout()
    }
  }, [performLogout])

  const setTokens = useCallback(
    (tokensBag: AuthTokens<A, R>) => {
      tokenRef.current = tokensBag
      dispatch({
        type: SET_TOKENS,
        payload: tokensBag,
      })
      storage.setTokens(tokensBag)
    },
    [dispatch, storage]
  )

  const {
    callAuthApiPromise,
    callAuthApiObservable,
    unsubscribe,
  } = useConstant(() => {
    return makeCallApiRx(
      refreshTokenCall,
      dispatch,
      storage,
      tokenRef,
      bootRef,
      actionObservable
    )
  })

  // Memoized actions
  const actions = useMemo(
    () => ({
      ...boundActionCreators,
      callAuthApiPromise,
      callAuthApiObservable,
      login,
      logout,
      setTokens,
    }),
    [
      login,
      logout,
      boundActionCreators,
      callAuthApiPromise,
      callAuthApiObservable,
      setTokens,
    ]
  )

  // Derived state for auth
  // Why this even if the token change user still authenticated
  const authState = useMemo(
    () => ({
      bootstrappedAuth,
      authenticated,
      loginLoading,
      loginError,
    }),
    [authenticated, bootstrappedAuth, loginLoading, loginError]
  )

  const authUser: AuthUser<U, A> = useMemo(
    () => ({
      user: state.user,
      token: accessToken,
    }),
    [state.user, accessToken]
  )

  useEffect(() => {
    return () => {
      // Goodbye Space Cowboy
      unsubscribe()
      unsubscribeFromLogin()
    }
  }, [unsubscribe, unsubscribeFromLogin])

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={authState}>
        <AuthUserContext.Provider value={authUser}>
          {typeof render === 'function'
            ? render(actions, authState, authUser)
            : children}
        </AuthUserContext.Provider>
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  )
}
