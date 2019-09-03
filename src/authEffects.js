import {
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,
  LOGIN_LOADING,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  TOKEN_REFRESHED,
  LOGOUT,
} from './actionTypes'

function makeCallWithRefresh(refreshTokenCall, accessToken, refreshToken) {
  return (apiFn, ...args) => {
    return apiFn(...args, accessToken).then(
      response => [response, null],
      error => {
        if (
          // Tri refresh when:
          // Got an auth error
          error.status === 401 &&
          // We have a refresh token and an api call that we can perform
          // 2 refresh it!
          refreshToken &&
          typeof refreshTokenCall === 'function'
        ) {
          return refreshTokenCall(refreshToken).then(
            refreshedTokens => {
              // Yeah refresh appends!
              // Ok now retry the apiFn \w refreshed shit!
              return apiFn(...args, refreshedTokens.accessToken).then(
                response => {
                  // console.log('Refresh appends!', refreshedTokens)
                  // Curry the refreshed shit \w response
                  return [response, refreshedTokens]
                },
                // The error of new api fn don't really means
                // instead reject the original 401 to enforce logout process
                () => Promise.reject(error)
              )
            },
            // At this point the refresh error does not is so usefuel
            // instead reject the original 401 to enforce logout process
            () => Promise.reject(error)
          )
        }
        // Normal rejection
        return Promise.reject(error)
      }
    )
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

  storage.getTokens().then(tokensInStorage => {
    // console.log('What in storage?', tokensInStorage)

    // No tokens in storage Nothing 2 do
    if (!tokensInStorage) {
      endBoot()
      return
    }

    // Prepare the ~ M A G I K ~ Api call with refresh
    const callWithRefresh = makeCallWithRefresh(
      refreshTokenCall,
      tokensInStorage.accessToken,
      tokensInStorage.refreshToken
    )

    // Call with refresh!
    // fn(token) -> 401 -> refreshTokenCall(refreshToken) -> fn(freshedToken)
    callWithRefresh(meCall).then(
      responseWithRefresh => {
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
      },
      error => {
        endBoot()
        // Clear bad tokens from storage
        storage.removeTokens()
      }
    )
  }, endBoot)
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

    loginCall(loginCredentials).then(loginResponse => {
      const { accessToken, refreshToken, expires = null } = loginResponse

      meCall(accessToken, loginResponse).then(user => {
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

export function performCallApi(
  apiFn,
  refreshTokenCall,
  storage,
  dispatch,
  tokenRef,
  ...args
) {
  // Get the actual token
  const { accessToken = null, refreshToken = null } = tokenRef.current || {}

  // Prepare the ~ M A G I K ~ Api call with refresh
  const callWithRefresh = makeCallWithRefresh(
    refreshTokenCall,
    accessToken,
    refreshToken
  )
  // console.log('SACRO TOKEN', accessToken)
  return callWithRefresh(apiFn, ...args).then(
    responseWithRefresh => {
      const [response, refreshedTokens] = responseWithRefresh

      if (refreshedTokens) {
        dispatch({
          type: TOKEN_REFRESHED,
          payload: refreshedTokens,
        })
        storage.setTokens(refreshedTokens)
      }

      return response
    },
    error => {
      if (error.status === 401) {
        // NOTE: Not sure if is really a good idea but i think
        // this can't prevetn some edge cases
        if (tokenRef.current && accessToken === tokenRef.current.accessToken) {
          // Clear token ref
          tokenRef.current = null
          // Trigger log out
          dispatch({ type: LOGOUT, payload: {} })
          storage.removeTokens()
        }
      }
      return Promise.reject(error)
    }
  )
}
