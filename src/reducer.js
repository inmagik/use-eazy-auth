import {
  // Form login auth actions
  LOGIN_LOADING,
  LOGIN_FAILURE,
  LOGIN_SUCCESS,

  // Clear the login error
  CLEAR_LOGIN_ERROR,

  // Boostrapping auth / getting tokens from nowhere...
  BOOTSTRAP_AUTH_START,
  BOOTSTRAP_AUTH_END,

  // Initial auth from local storage token actions
  // AUTH_WITH_TOKEN_LOADING,
  // AUTH_WITH_TOKEN_FAILURE,
  // AUTH_WITH_TOKEN_SUCCESS,

  // Token refreshed
  TOKEN_REFRESHED,

  // Update user data
  UPDATE_USER,

  // Path user data
  PATCH_USER,

  // Logout action
  LOGOUT,
} from './actionTypes'

export const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expires: null,

  loginLoading: false,
  loginError: null,

  //....
  // MAP to -> authBooted
  bootstrappedAuth: false,
  bootstrappingAuth: false,
  // authenticatingWithToken: false,
  // logoutFromPermission: false,
}

const authReducer = (
  previousState = initialState,
  { type, payload, error }
) => {
  switch (type) {
    case LOGIN_LOADING:
      return {
        ...previousState,
        loginLoading: true,
        loginError: null,
      }
    case LOGIN_FAILURE:
      return {
        ...previousState,
        loginLoading: false,
        loginError: error,
      }
    case CLEAR_LOGIN_ERROR: {
      if (previousState.loginError === null) {
        return previousState
      }
      return {
        ...previousState,
        loginError: null,
      }
    }
    case LOGIN_SUCCESS:
      return {
        ...previousState,
        loginLoading: false,
        user: payload.user,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        expires: payload.expires,
        // logoutFromPermission: false,
      }
    case BOOTSTRAP_AUTH_START:
      return {
        ...previousState,
        bootstrappingAuth: true,
      }
    case BOOTSTRAP_AUTH_END: {
      let nextState = {
        ...previousState,
        bootstrappedAuth: true,
        bootstrappingAuth: false,
      }
      if (payload.authenticated) {
        const {
          user,
          accessToken,
          refreshToken = null,
          expires = null,
        } = payload
        return {
          ...nextState,
          user,
          accessToken,
          refreshToken,
          expires,
        }
      }
      return nextState
    }
    // case AUTH_WITH_TOKEN_LOADING:
    //   return {
    //     ...previousState,
    //     authenticatingWithToken: true,
    //   }
    // case AUTH_WITH_TOKEN_FAILURE:
    //   return {
    //     ...previousState,
    //     authenticatingWithToken: false,
    //   }
    // case AUTH_WITH_TOKEN_SUCCESS:
    //   return {
    //     ...previousState,
    //     authenticatingWithToken: false,
    //     expires: payload.expires,
    //     user: payload.user,
    //     accessToken: payload.accessToken,
    //     refreshToken: payload.refreshToken,
    //   }
    case TOKEN_REFRESHED:
      return {
        ...previousState,
        expires: payload.expires,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      }
    case UPDATE_USER:
      return {
        ...previousState,
        user: payload,
      }
    case PATCH_USER:
      return {
        ...previousState,
        user: {
          ...previousState.user,
          ...payload,
        },
      }
    case LOGOUT:
      return {
        ...initialState,
        // Logout doesn't mean re check tokens in ls and so on...
        bootstrappedAuth: previousState.bootstrappedAuth,
        // logoutFromPermission: payload.fromPermission,
      }
    default:
      return previousState
  }
}

export default authReducer
