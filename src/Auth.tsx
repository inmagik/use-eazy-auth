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
import { bootAuth, LoginEffect, makePerformLogin } from './authEffects'
import makeCallApiRx, { CallApiEffect } from './callApiRx'
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
  callAuthApiObservable<O, FA extends any[] = any[]>(
    apiFn: CurryAuthApiFn<A, O, FA>,
    ...args: any[]
  ): Observable<O>

  callAuthApiPromise<O, FA extends any[] = any[]>(
    apiFn: CurryAuthApiFnPromise<A, O, FA>,
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

  // Simply keep a token reference lol
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

  // Keep a lazy init ref to login effect
  const loginEffectRef = useRef<LoginEffect<C> | null>(null)

  // NOTE: This respect the old useConstant implementation
  // All makePerformLogin deps are treat as constants
  const loginEffectGetter = useRef(() => {
    if (loginEffectRef.current === null) {
      loginEffectRef.current = makePerformLogin<A, R, U, C>(
        loginCall,
        meCall,
        storage,
        dispatch,
        tokenRef
      )
    }
    return loginEffectRef.current
  })

  const login = useCallback(
    (loginCredentials: C) => {
      if (
        // Is eazy auth boostrapped?
        bootstrappedAuth &&
        // Is ma men alredy logged?
        !authenticated
      ) {
        const { performLogin } = loginEffectGetter.current()
        performLogin(loginCredentials)
      }
    },
    [authenticated, bootstrappedAuth]
  )

  // Unsubscribe from login effect
  useEffect(() => {
    return () => {
      if (loginEffectRef.current !== null) {
        // Here it's safe to say: "Goodbye Space Cowboy" lol
        loginEffectRef.current.unsubscribe()
        loginEffectRef.current = null
      }
    }
  }, [])

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

  // Keep a lazy ref to call api effect
  const callApiEffectRef = useRef<CallApiEffect<A> | null>(null)

  // Lazy get call api effect
  const callApiEffecGetter = useRef(() => {
    if (callApiEffectRef.current === null) {
      callApiEffectRef.current = makeCallApiRx(
        refreshTokenCall,
        dispatch,
        storage,
        tokenRef,
        bootRef,
        actionObservable
      )
    }
    return callApiEffectRef.current
  })

  // Proxy call methods throught lazy getter
  const callAuthApiPromise = useCallback(function callAuthApiPromise<O>(
    apiFn: CurryAuthApiFnPromise<A, O>,
    ...args: any[]
  ) {
    return callApiEffecGetter.current().callAuthApiPromise(apiFn, ...args)
  },
  [])
  const callAuthApiObservable = useCallback(function callAuthApiPromise<O>(
    apiFn: CurryAuthApiFn<A, O>,
    ...args: any[]
  ) {
    return callApiEffecGetter.current().callAuthApiObservable(apiFn, ...args)
  },
  [])

  // Unsubscribe safe from call api
  useEffect(() => {
    return () => {
      if (callApiEffectRef.current !== null) {
        // Here it's safe to say: "Goodbye Space Cowboy" lol
        callApiEffectRef.current.unsubscribe()
        callApiEffectRef.current = null
      }
    }
  }, [])

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
