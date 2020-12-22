import {
  UPDATE_USER,
  PATCH_USER,
  CLEAR_LOGIN_ERROR,
  FunctionalUpdaterUser,
} from './actionTypes'

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
