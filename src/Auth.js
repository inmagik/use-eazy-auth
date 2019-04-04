import React, {
  useCallback,
  createContext,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { makeStorage } from './storage'
import { useConstant } from './helperHooks'
import { useBootAuth, performLogin, performCallApi } from './authEffects'
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
  loginCall,
  meCall,
  storageBackend,
  storageNamespace = 'auth',
}) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const storage = useMemo(() => makeStorage(storageBackend, storageNamespace), [
    storageBackend,
    storageNamespace,
  ])

  const {
    bootstrappedAuth,
    accessToken,
    loginLoading,
    loginError,
  } = state

  // TODO: Check better strategy and future trouble \w async react
  // This trick is done because token can change over time Es:. the token was refresh
  // But the callApi function instance can't change because this can cause
  // re-running of other useEffect \w callApi as deps or break other
  // memoization ... plus this approch guarantee doesn't trigger re-render
  // of components thath subscribe only to auth actions when token changes
  const tokenRef = useRef(null)

  // Is authenticated when has an access token eazy
  const authenticated = !!accessToken

  // Boot Eazy Auth
  useBootAuth(meCall, storage, dispatch, tokenRef)

  // ~~ Make Actions ~~~

  // Actions creator should't change between renders
  const bindedActionCreators = useConstant(() =>
    bindActionCreators(actionCreators, dispatch)
  )

  const login = useCallback(
    loginCredentials => {
      // Nothing 2 do
      if (
        // Is eazy auth boostrapped?
        !bootstrappedAuth ||
        // Is alredy loading call in place?
        loginLoading ||
        // Is ma men alredy logged?
        authenticated
      ) {
        return
      }
      return (
        performLogin(loginCredentials, loginCall, meCall, storage, dispatch, tokenRef)
          // Keep promise perform login for future use....
          .then(noop, noop)
      )
    },
    [bootstrappedAuth, authenticated, loginLoading, loginCall, meCall, storage]
  )

  const logout = useCallback(() => {
    if (authenticated) {
      // Clear token ref
      tokenRef.current = null
      // Trigger log out
      dispatch({ type: LOGOUT, payload: {} })
      storage.removeTokens()
    }
  }, [storage, authenticated, tokenRef])

  // For now simple curry the access token and logout
  // when get 401
  const callApi = useCallback(
    (apiFn, ...args) => performCallApi(apiFn, storage, dispatch, tokenRef, ...args),
    [storage, tokenRef]
  )

  // Memoized actions
  const actions = useMemo(
    () => ({
      ...bindedActionCreators,
      callApi,
      login,
      logout,
    }),
    [login, logout, callApi, bindedActionCreators]
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
          {children}
        </AuthUserContext.Provider>
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  )
}
