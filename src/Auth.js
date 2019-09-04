import React, {
  useCallback,
  createContext,
  useMemo,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import { Subject } from 'rxjs'
import { makeStorage } from './storage'
import { useConstant } from './helperHooks'
import { bootAuth, performLogin, performCallApi } from './authEffects'
import makeCallApiRx from './callApiRx'
// Reducer stuff
import authReducer, { initialState } from './reducer'
import bindActionCreators from './bindActionCreators'
import * as actionCreators from './actions'
import { LOGOUT } from './actionTypes'

// Declare Eazy Auth contexts
export const AuthStateContext = createContext(initialState)
export const AuthUserContext = createContext(null)
export const AuthActionsContext = createContext({})

// n00p
const noop = () => {}

export default function Auth({
  children,
  render,
  loginCall,
  meCall,
  refreshTokenCall,
  storageBackend,
  storageNamespace = 'auth',
}) {
  const [state, originalDispatch] = useReducer(authReducer, initialState)
  const [actionObservable, dispatch] = useConstant(() => {
    const actionSubject = new Subject()
    const dispatch = action => {
      originalDispatch(action)
      actionSubject.next(action)
    }
    return [actionSubject.asObservable(), dispatch]
  })

  const storage = useMemo(() => makeStorage(storageBackend, storageNamespace), [
    storageBackend,
    storageNamespace,
  ])

  const {
    bootstrappedAuth,
    bootstrappingAuth,
    accessToken,
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
  const tokenRef = useRef(null)

  // Is authenticated when has an access token eazy
  // This line can't look stupid but is very very important
  const authenticated = !!accessToken

  // Handle the ref of booting status of eazy auth
  const bootRef = useRef(false)

  // Boot Eazy Auth
  useEffect(() => {
    // Ensure auth boostrapped only once
    if (!bootstrappedAuth && !bootstrappingAuth) {
      bootAuth(meCall, refreshTokenCall, storage, dispatch, tokenRef, bootRef)
    }
  }, [
    meCall,
    refreshTokenCall,
    storage,
    bootstrappedAuth,
    bootstrappingAuth,
    dispatch,
  ])

  // ~~ Make Actions ~~~

  // Actions creator should't change between renders
  const bindedActionCreators = useConstant(() =>
    bindActionCreators(actionCreators, dispatch)
  )

  const login = useCallback(
    loginCredentials => {
      if (
        // Is eazy auth boostrapped?
        bootstrappedAuth &&
        // Is alredy loading call in place?
        !loginLoading &&
        // Is ma men alredy logged?
        !authenticated
      ) {
        performLogin(
          loginCredentials,
          loginCall,
          meCall,
          storage,
          dispatch,
          tokenRef
        )
          // Keep perform login returing a Promise for future use....
          .then(noop, noop)
      }
    },
    [
      meCall,
      loginCall,
      storage,
      bootstrappedAuth,
      authenticated,
      loginLoading,
      dispatch,
    ]
  )

  const performLogout = useCallback(() => {
    // Clear token ref
    tokenRef.current = null
    // Trigger log out
    dispatch({ type: LOGOUT, payload: {} })
    storage.removeTokens()
  }, [storage, dispatch])

  const logout = useCallback(() => {
    if (authenticated) {
      performLogout()
    }
  }, [performLogout, authenticated])

  // Handle the ref of refreshing token status of eazy auth
  const refreshingRef = useRef(false)
  const { callAuthApiPromise, callAuthApiObservable } = useConstant(() => {
    return makeCallApiRx(
      refreshTokenCall,
      dispatch,
      storage,
      tokenRef,
      bootRef,
      refreshingRef,
      actionObservable,
      performLogout
    )
  })

  const callApi = useCallback(
    (apiFn, ...args) =>
      performCallApi(
        apiFn,
        refreshTokenCall,
        storage,
        dispatch,
        tokenRef,
        ...args
      ),
    [refreshTokenCall, storage, dispatch]
  )

  // Memoized actions
  const actions = useMemo(
    () => ({
      ...bindedActionCreators,
      callApi,
      callAuthApiPromise,
      callAuthApiObservable,
      login,
      logout,
    }),
    [
      login,
      logout,
      callApi,
      bindedActionCreators,
      callAuthApiPromise,
      callAuthApiObservable,
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

  const userState = useMemo(
    () => ({
      user: state.user,
      token: accessToken,
    }),
    [state.user, accessToken]
  )

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={authState}>
        <AuthUserContext.Provider value={userState}>
          {typeof render === 'function'
            ? render(actions, authState, userState)
            : children}
        </AuthUserContext.Provider>
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  )
}
