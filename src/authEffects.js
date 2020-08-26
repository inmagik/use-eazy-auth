import {
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,
  LOGIN_LOADING,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
} from './actionTypes'
import { from, of, throwError } from 'rxjs'
import { mergeMap, map, catchError } from 'rxjs/operators'

function makeCallWithRefresh(refreshTokenCall, accessToken, refreshToken) {
  return (apiFn, ...args) => {
    return from(apiFn(...args, accessToken)).pipe(
      map((response) => [response, null]),
      catchError((error) => {
        if (
          // Tri refresh when:
          // Got an auth error
          error.status === 401 &&
          // We have a refresh token and an api call that we can perform
          // 2 refresh it!
          refreshToken &&
          typeof refreshTokenCall === 'function'
        ) {
          return from(refreshTokenCall(refreshToken)).pipe(
            mergeMap((refreshedTokens) => {
              // Yeah refresh appends!
              // Ok now retry the apiFn \w refreshed shit!
              return from(apiFn(...args, refreshedTokens.accessToken)).pipe(
                map((response) => {
                  // console.log('Refresh appends!', refreshedTokens)
                  // Curry the refreshed shit \w response
                  return [response, refreshedTokens]
                }),
                // The error of new api fn don't really means
                // instead reject the original 401 to enforce logout process
                catchError(() => catchError(error))
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

    // return apiFn(...args, accessToken).then(
    //   (response) => [response, null],
    //   (error) => {
    //     if (
    //       // Tri refresh when:
    //       // Got an auth error
    //       error.status === 401 &&
    //       // We have a refresh token and an api call that we can perform
    //       // 2 refresh it!
    //       refreshToken &&
    //       typeof refreshTokenCall === 'function'
    //     ) {
    //       return refreshTokenCall(refreshToken).then(
    //         (refreshedTokens) => {
    //           // Yeah refresh appends!
    //           // Ok now retry the apiFn \w refreshed shit!
    //           return apiFn(...args, refreshedTokens.accessToken).then(
    //             (response) => {
    //               // console.log('Refresh appends!', refreshedTokens)
    //               // Curry the refreshed shit \w response
    //               return [response, refreshedTokens]
    //             },
    //             // The error of new api fn don't really means
    //             // instead reject the original 401 to enforce logout process
    //             () => Promise.reject(error)
    //           )
    //         },
    //         // At this point the refresh error does not is so usefuel
    //         // instead reject the original 401 to enforce logout process
    //         () => Promise.reject(error)
    //       )
    //     }
    //     // Normal rejection
    //     return Promise.reject(error)
    //   }
    // )
  }
}

// Boot eazy-auth
// Read tokens from provided storage
// if any try to use theese to authenticate the user \w the given meCall
// LS -> meCall(token) -> user
// dispatch to top state and keep token in sync using a React useRef
export function bootAuth(
  meCall,
  refreshTokenCall,
  storage,
  dispatch,
  tokenRef,
  bootRef
) {
  // Shortcut to finish boot process default not authenticated
  function endBoot(payload = { authenticated: false }) {
    bootRef.current = true
    dispatch({ type: BOOTSTRAP_AUTH_END, payload })
  }

  // console.log('Booootstrap Ma MEN Eazy Auth')
  dispatch({ type: BOOTSTRAP_AUTH_START })

  const subscription = from(storage.getTokens())
    .pipe(
      mergeMap((tokensInStorage) => {
        // No tokens in storage Nothing 2 do
        if (!tokensInStorage) {
          return of([tokensInStorage, null])
        }

        // Prepare the ~ M A G I K ~ Api call with refresh
        const callWithRefresh = makeCallWithRefresh(
          refreshTokenCall,
          tokensInStorage.accessToken,
          tokensInStorage.refreshToken
        )

        return callWithRefresh(meCall).pipe(
          catchError((err) => {
            // Clear bad tokens from storage
            storage.removeTokens()
            return throwError(err)
          }),
          map((responseWithRefresh) => [tokensInStorage, responseWithRefresh])
        )
      })
    )
    .subscribe(([tokensInStorage, responseWithRefresh]) => {
      // Nothing to do
      if (!responseWithRefresh) {
        endBoot()
      }
      const [user, refreshedTokens] = responseWithRefresh
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

  // storage.getTokens().then((tokensInStorage) => {
  //   // console.log('What in storage?', tokensInStorage)

  //   // No tokens in storage Nothing 2 do
  //   if (!tokensInStorage) {
  //     endBoot()
  //     return
  //   }

  //   // Prepare the ~ M A G I K ~ Api call with refresh
  //   const callWithRefresh = makeCallWithRefresh(
  //     refreshTokenCall,
  //     tokensInStorage.accessToken,
  //     tokensInStorage.refreshToken
  //   )

  //   // Call with refresh!
  //   // fn(token) -> 401 -> refreshTokenCall(refreshToken) -> fn(freshedToken)
  //   callWithRefresh(meCall).then(
  //     (responseWithRefresh) => {
  //       const [user, refreshedTokens] = responseWithRefresh
  //       // If token refreshed take the token refreshed as valid otherwise use the good
  //       // old tokens from local storage
  //       const validTokens = refreshedTokens ? refreshedTokens : tokensInStorage

  //       // GANG saved the valid tokens to the current ref!
  //       tokenRef.current = validTokens

  //       // Tell to ma reducer
  //       endBoot({
  //         authenticated: true,
  //         user,
  //         ...validTokens,
  //       })
  //       // Plus only if refreshed save freshed in local storage!
  //       if (refreshedTokens) {
  //         storage.setTokens(refreshedTokens)
  //       }
  //     },
  //     (error) => {
  //       endBoot()
  //       // Clear bad tokens from storage
  //       storage.removeTokens()
  //     }
  //   )
  // }, endBoot)
}

export function performLogin(
  loginCredentials,
  loginCall,
  meCall,
  storage,
  dispatch,
  tokenRef
) {
  return new Promise((resolve, reject) => {
    // Shortcut to finish login \w failure
    function loginFailed(error) {
      dispatch({
        type: LOGIN_FAILURE,
        error,
      })
      reject(error)
    }

    // console.log('~Log Me IN ~')
    dispatch({ type: LOGIN_LOADING })

    loginCall(loginCredentials).then((loginResponse) => {
      const { accessToken, refreshToken, expires = null } = loginResponse

      meCall(accessToken, loginResponse).then((user) => {
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
        resolve(user, accessToken)
      }, loginFailed)
    }, loginFailed)
  })
}
