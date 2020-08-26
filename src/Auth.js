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
import { bootAuth, performLogin } from './authEffects'
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
  const mountedRef = useRef(true)
  const [state, originalDispatch] = useReducer(authReducer, initialState)
  const [actionObservable, dispatch] = useConstant(() => {
    const actionSubject = new Subject()
    const dispatch = (action) => {
      // TODO: This just works ... BUT ...
      // bootAuth and performLogin are not implement in a way
      // that make easy to cancel all related tasks ...
      // so the following workaround protecte use from
      // "Can't perform a React state update on an unmounted component"
      // but if <Auth /> is unmounted to early all related side effects
      // still in place so in another life rewrite all this with RxJS
      // so unsub from them should be easy .....
      // if (mountedRef.current) {
      originalDispatch(action)
      actionSubject.next(action)
      // }
    }
    return [actionSubject.asObservable(), dispatch]
  })

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
  // NOTE: Fuck off this subtle change the old bheaviur
  // before the boot will never appends twice but can't be stopped
  // ... now if storange change this will take again ... but storage
  // isn't supporting to changes but in theory the change of storage
  // should re-booting ma men eazy autth bho maybe check 4 future troubles
  // and come here again
  useEffect(() => {
    return bootAuth(
      meCall,
      refreshTokenCall,
      storage,
      dispatch,
      tokenRef,
      bootRef
    )
  }, [
    meCall,
    refreshTokenCall,
    storage,
    dispatch,
  ])

  // ~~ Make Actions ~~~

  // Actions creator should't change between renders
  const bindedActionCreators = useConstant(() =>
    bindActionCreators(actionCreators, dispatch)
  )

  const login = useCallback(
    (loginCredentials) => {
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
      refreshingRef,
      actionObservable,
      performLogout
    )
  })

  // Memoized actions
  const actions = useMemo(
    () => ({
      ...bindedActionCreators,
      callAuthApiPromise,
      callAuthApiObservable,
      login,
      logout,
    }),
    [
      login,
      logout,
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

  useEffect(() => {
    return () => {
      // Goodbye Space Cowboy
      unsubscribe()
      mountedRef.current = false
    }
  }, [unsubscribe])

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
