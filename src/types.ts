import { Observable } from "rxjs"

export interface AuthTokens<A = any, R = any> {
  accessToken: A
  refreshToken?: R | null
  expires?: number | null // Optional expires time in seconds
}

export interface InitialAuthData<A = any, R = any, U = any>  {
  accessToken: A | null
  refreshToken?: R | null
  expires?: number | null
  user: U | null
}

export type RefreshTokenCall<A = any, R = any> = (
  refreshToken: R
) => Promise<AuthTokens<A, R>> | Observable<AuthTokens<A, R>>

export type MeCall<T = any, U = any, L = any> = (
  accessToken: T,
  loginResponse?: L
) => Promise<U> | Observable<U>

export type LoginCall<C = any, A = any, R = any> = (
  loginCredentials: C
) => Promise<AuthTokens<A, R>> | Observable<AuthTokens<A, R>>

export type CurryAuthApiFnPromise<A = any, O = any> = (
  accessToken: A
) => (...args: any[]) => Promise<O>

export type CurryAuthApiFn<A = any, O = any> = (
  accessToken: A
) => (...args: any[]) => Observable<O> | Promise<O>