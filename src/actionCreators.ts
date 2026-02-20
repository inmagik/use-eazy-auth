import {
  UPDATE_USER,
  PATCH_USER,
  CLEAR_LOGIN_ERROR,
  SET_TOKENS,
  FunctionalUpdaterUser,
} from './actionTypes'
import { AuthTokens } from './types'

export const clearLoginError = () => ({
  type: CLEAR_LOGIN_ERROR,
})

export const updateUser = <U = any>(
  userOrUpdater: U | FunctionalUpdaterUser<U> | null
) => ({
  type: UPDATE_USER,
  payload: userOrUpdater,
})

export const patchUser = <U = any>(partialUser: Partial<U>) => ({
  type: PATCH_USER,
  payload: partialUser,
})


export const setTokens = <A = any, R = any>(authTokens: AuthTokens<A, R>) => ({
  type: SET_TOKENS,
  payload: authTokens,
})
