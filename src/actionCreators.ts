import { UPDATE_USER, PATCH_USER, CLEAR_LOGIN_ERROR } from './actionTypes'

export const clearLoginError = () => ({
  type: CLEAR_LOGIN_ERROR,
})

export const updateUser = <U = any>(user: U) => ({
  type: UPDATE_USER,
  payload: user,
})

export const patchUser = <U = any>(partialUser: Partial<U>) => ({
  type: PATCH_USER,
  payload: partialUser,
})
