import { UPDATE_USER, PATCH_USER, CLEAR_LOGIN_ERROR } from './actionTypes'

export const clearLoginError = () => ({
  type: CLEAR_LOGIN_ERROR,
})

export const updateUser = user => ({
  type: UPDATE_USER,
  payload: user,
})

export const patchUser = partialUser => ({
  type: PATCH_USER,
  payload: partialUser,
})
