import { Observable, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
import { InitialAuthData } from './Auth'
import { getBootAuthObservable } from './authEffects'
import { makeStorage, StorageBackend } from './storage'
import { MeCall, RefreshTokenCall } from './types'

export default function getInitialData<A, R, U>(
  meCall: MeCall<A, U>,
  refreshTokenCall: RefreshTokenCall<A, R> | undefined,
  storageBackend?: StorageBackend | false
): Observable<InitialAuthData<A, R, U>> {
  const storage = makeStorage<A, R>(storageBackend, 'auth')
  return getBootAuthObservable(meCall, refreshTokenCall, storage).pipe(
    tap(({ responseWithRefresh: { refreshedTokens } }) => {
      if (refreshedTokens) {
        storage.setTokens(refreshedTokens)
      }
    }),
    map(({ tokensInStorage, responseWithRefresh }) => {
      const { response: user, refreshedTokens } = responseWithRefresh
      const validTokens = refreshedTokens ? refreshedTokens : tokensInStorage
      return {
        authTokens: validTokens,
        user,
      }
    }),
    catchError(() => {
      return of({
        authTokens: null,
        user: null,
      })
    })
  )
}
