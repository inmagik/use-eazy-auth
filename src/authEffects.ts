import { Dispatch, MutableRefObject } from 'react'
import { from, of, throwError, Subject, Observable } from 'rxjs'
import { mergeMap, map, catchError, exhaustMap, tap } from 'rxjs/operators'
import {
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,
  LOGIN_LOADING,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  AuthActions,
  EndBootPayload,
} from './actionTypes'
import { AuthStorage } from './storage'
import { AuthTokens, LoginCall, MeCall, RefreshTokenCall } from './types'
import { isUnauthorizedError } from './utils'

export type ApiFn<T = any, O = any> = (token: T) => Promise<O> | Observable<O>

function makeCallWithRefresh<A, R>(
  accessToken: A,
  refreshToken?: R | null,
  refreshTokenCall?: RefreshTokenCall<A, R>
) {
  return (
    apiFn: ApiFn<A>
  ): Observable<{
    response: any
    refreshedTokens: null | AuthTokens<A, R>
  }> => {
    return from(apiFn(accessToken)).pipe(
      map((response) => ({ response, refreshedTokens: null })),
      catchError((error) => {
        if (
          // Try refresh when:
          // Got an auth error
          isUnauthorizedError(error) &&
          // We have a refresh token and an api call that we can perform
          // 2 refresh it!
          refreshToken &&
          typeof refreshTokenCall === 'function'
        ) {
          return from(refreshTokenCall(refreshToken)).pipe(
            mergeMap((refreshedTokens) => {
              // Yeah refresh appends!
              // Ok now retry the apiFn \w refreshed shit!
              return from(apiFn(refreshedTokens.accessToken)).pipe(
                map((response) => {
                  // Curry the refreshed shit \w response
                  return { response, refreshedTokens }
                }),
                // The error of new api fn don't really means
                // instead reject the original 401 to enforce logout process
                catchError(() => throwError(error))
              )
            }),
            // At this point the refresh error does not is so usefuel
            // instead reject the original 401 to enforce logout process
            catchError(() => throwError(error))
          )
        }
        // Normal rejection
        return throwError(error)
      })
    )
  }
}

export function getBootAuthObservable<A, R>(
  meCall: MeCall<A>,
  refreshTokenCall: RefreshTokenCall<A, R> | undefined,
  storage: AuthStorage<A, R>
) {
  return from(storage.getTokens()).pipe(
    mergeMap((tokensInStorage) => {
      // Prepare the ~ M A G I K ~ Api call with refresh
      const callWithRefresh = makeCallWithRefresh(
        tokensInStorage.accessToken,
        tokensInStorage.refreshToken,
        refreshTokenCall
      )

      return callWithRefresh(meCall).pipe(
        catchError((err) => {
          // Clear bad tokens from storage
          storage.removeTokens()
          return throwError(err)
        }),
        map((responseWithRefresh) => ({
          tokensInStorage,
          responseWithRefresh,
        }))
      )
    })
  )
}

// Boot eazy-auth
// Read tokens from provided storage
// if any try to use theese to authenticate the user \w the given meCall
// LS -> meCall(token) -> user
// dispatch to top state and keep token in sync using a React useRef
export function bootAuth<A = any, R = any>(
  meCall: MeCall<A>,
  refreshTokenCall: RefreshTokenCall<A, R> | undefined,
  storage: AuthStorage<A, R>,
  dispatch: Dispatch<AuthActions>,
  tokenRef: MutableRefObject<AuthTokens<A, R> | null>,
  bootRef: MutableRefObject<boolean>
) {
  // My Auth Alredy Booted
  if (bootRef.current) {
    return () => {}
  }

  // Shortcut to finish boot process default not authenticated
  function endBoot(payload: EndBootPayload = { authenticated: false }) {
    bootRef.current = true
    dispatch({
      type: BOOTSTRAP_AUTH_END,
      payload,
    })
  }

  dispatch({ type: BOOTSTRAP_AUTH_START })

  const subscription = getBootAuthObservable(
    meCall,
    refreshTokenCall,
    storage
  ).subscribe(({ tokensInStorage, responseWithRefresh }) => {
    const { response: user, refreshedTokens } = responseWithRefresh
    // If token refreshed take the token refreshed as valid otherwise use the good
    // old tokens from local storage
    const validTokens = refreshedTokens ? refreshedTokens : tokensInStorage
    // GANG saved the valid tokens to the current ref!
    tokenRef.current = validTokens
    // Tell to ma reducer
    endBoot({
      authenticated: true,
      user,
      ...validTokens,
    })
    // Plus only if refreshed save freshed in local storage!
    if (refreshedTokens) {
      storage.setTokens(refreshedTokens)
    }
  }, endBoot)

  return () => subscription.unsubscribe()
}

interface SuccessLoginEffectAction<A, R> {
  type: typeof LOGIN_SUCCESS
  payload: {
    loginResponse: AuthTokens<A, R>
    user: any
  }
}

interface FailureLoginEffectAction {
  type: typeof LOGIN_FAILURE
  error: any
}

export interface LoginEffect<C = any> {
  performLogin: (loginCredentials: C) => void
  unsubscribe(): void
}

export function makePerformLogin<A = any, R = any, U = any, C = any>(
  loginCall: LoginCall<C, A, R>,
  meCall: MeCall<A, U>,
  storage: AuthStorage<A, R>,
  dispatch: Dispatch<AuthActions<A, R, U>>,
  tokenRef: MutableRefObject<AuthTokens<A, R> | null>
): LoginEffect<C> {
  const loginTrigger = new Subject<C>()

  const subscription = loginTrigger
    .asObservable()
    .pipe(
      tap(() => dispatch({ type: LOGIN_LOADING })),
      exhaustMap((loginCredentials) => {
        return from(loginCall(loginCredentials)).pipe(
          mergeMap((loginResponse) => {
            const { accessToken } = loginResponse
            return from(meCall(accessToken, loginResponse)).pipe(
              map(
                (user) =>
                  ({
                    type: LOGIN_SUCCESS,
                    payload: { loginResponse, user },
                  } as SuccessLoginEffectAction<A, R>)
              )
            )
          }),
          catchError((error) =>
            of({
              type: LOGIN_FAILURE,
              error,
            } as FailureLoginEffectAction)
          )
        )
      })
    )
    .subscribe((action) => {
      if (action.type === LOGIN_SUCCESS) {
        // Login Flow Success
        const { loginResponse, user } = action.payload
        const { accessToken, refreshToken, expires = null } = loginResponse
        // Save the token ref GANG!
        tokenRef.current = { accessToken, refreshToken, expires }
        dispatch({
          type: LOGIN_SUCCESS,
          payload: {
            user,
            expires,
            accessToken,
            refreshToken,
          },
        })
        // Ok this can be an async action sure but
        // is better wait them and so do waiting the use before
        // notify them that login was success i don't kown....
        storage.setTokens({
          expires,
          accessToken,
          refreshToken,
        })
      } else if (action.type === LOGIN_FAILURE) {
        // Login Flow Failure
        dispatch(action)
      }
    })

  const performLogin = (loginCredentials: C) => {
    loginTrigger.next(loginCredentials)
  }

  const unsubscribe = () => {
    subscription.unsubscribe()
  }

  return { performLogin, unsubscribe }
}
