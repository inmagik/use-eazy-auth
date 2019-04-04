import { useEffect } from 'react'
import {
  BOOTSTRAP_AUTH_START,
  AUTH_WITH_TOKEN_LOADING,
  AUTH_WITH_TOKEN_SUCCESS,
  AUTH_WITH_TOKEN_FAILURE,
  BOOTSTRAP_AUTH_END,
  LOGIN_LOADING,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
} from './actionTypes'

// Hooks for booting eazy-auth
// Read tokens from provided storage
// if any try to use theese to authenticate the user \w the given meCall
// LS -> meCall(token) -> user
// dispatch to top state and keep token in sync using a React useRef
export function useBootAuth(meCall, storage, dispatch, tokenRef) {
  useEffect(() => {
    // console.log('Booootstrap Ma MEN Eazy Auth')

    dispatch({ type: BOOTSTRAP_AUTH_START })

    const endBoot = () => dispatch({ type: BOOTSTRAP_AUTH_END })

    storage.getTokens().then(tokens => {
      // console.log('What in storage?', tokens)

      // Nothing 2 do
      if (!tokens) {
        endBoot()
        return
      }

      const { accessToken } = tokens

      dispatch({ type: AUTH_WITH_TOKEN_LOADING })

      // TODO: Implement refresh ...
      meCall(accessToken).then(
        user => {
          tokenRef.current = accessToken
          // GANG save the token ref
          dispatch({
            type: AUTH_WITH_TOKEN_SUCCESS,
            payload: { user, accessToken },
          })
          endBoot()
        },
        error => {
          dispatch({
            type: AUTH_WITH_TOKEN_FAILURE,
            error,
          })
          endBoot()
          // Clear bad tokens
          storage.removeTokens()
        }
      )
    }, endBoot)
  }, [storage, meCall, dispatch, tokenRef])
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
    // console.log('~Log Me IN ~')

    dispatch({ type: LOGIN_LOADING })

    const loginFailed = error => {
      dispatch({
        type: LOGIN_FAILURE,
        error,
      })
      reject(error)
    }

    loginCall(loginCredentials).then(loginResponse => {
      const { accessToken, refreshToken, expires = null } = loginResponse

      meCall(accessToken, loginResponse).then(user => {
        // Save the token ref GANG!
        tokenRef.current = accessToken
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

export function performCallApi(apiFn, storage, dispatch, tokenRef, ...args) {
  // Get the actual token
  const accessToken = tokenRef.current
  // console.log('SACRO TOKEN', accessToken)
  // TODO: Implement with refresh ahhahahaahah
  return apiFn(...args, accessToken).catch(error => {
    if (error.status === 401) {
      // NOTE: Not sure if is really a good idea but i think
      // this can't prevetn some edge cases
      if (accessToken === tokenRef.current) {
        // Clear token ref
        tokenRef.current = null
        // Trigger log out
        dispatch({ type: LOGOUT, payload: {} })
        storage.removeTokens()
      }
    }
    return Promise.reject(error)
  })
}
