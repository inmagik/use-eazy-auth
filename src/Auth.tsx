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
import authReducer, { AuthStateShape, initialState } from './reducer'
import bindActionCreators from './bindActionCreators'
import * as actionCreators from './actionCreators'
import { AuthActions, LOGOUT, SET_TOKENS } from './actionTypes'
import {
  AuthTokens,
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

  updateUser(user: U): void

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
}

export default function Auth<A = any, R = any, U = any, C = any>({
  children,
  render,
  loginCall,
  meCall,
  refreshTokenCall,
  storageBackend,
  storageNamespace = 'auth',
}: AuthProps<A, R, U, C>) {
  const [state, originalDispatch] = useReducer<
    Reducer<AuthStateShape<A, R, U>, AuthActions>
  >(authReducer, initialState)

  const [actionObservable, dispatch] = useConstant(() => {
    const actionSubject = new Subject<AuthActions>()
    const dispatch = (action: AuthActions) => {
      originalDispatch(action)
      actionSubject.next(action)
    }
    return [actionSubject.asObservable(), dispatch]
  })

  const storage = useMemo(
    () => makeStorage<A, R>(storageBackend, storageNamespace),
    [storageBackend, storageNamespace]
  )

  const { bootstrappedAuth, accessToken, loginLoading, loginError } = state

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
  const tokenRef = useRef<AuthTokens<A, R> | null>(null)

  // Is authenticated when has an access token eazy
  // This line can't look stupid but is very very important
  const authenticated = !!accessToken

  // Handle the ref of booting status of eazy auth
  const bootRef = useRef(false)

  // Boot Eazy Auth
  // NOTE: Fuck off this subtle change the old bheaviur
  // before the boot will never appends twice but can't be stopped
  // ... now if storange change this will take again ... but storage
  // isn't supporting to changes but in theory the change of storage
  // should re-booting ma men eazy autth bho maybe check 4 future troubles
  // and come here again
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
    // Clear token ref
    tokenRef.current = null
    // Trigger log out
    dispatch({ type: LOGOUT })
    storage.removeTokens()
  }, [storage, dispatch])

  const logout = useCallback(() => {
    if (authenticated) {
      performLogout()
    }
  }, [performLogout, authenticated])

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
      actionObservable,
      performLogout
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
