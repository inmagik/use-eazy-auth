import { AuthTokens } from './types'

export interface StorageBackend {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

const noopStorageBackend: StorageBackend = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

// If a promise return them if other return the value as resolved promise ...
function getResolvedOrPromise<V>(value: V | Promise<V>): Promise<V> {
  // Check if a Promise...
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Promise<V>).then === 'function'
  ) {
    return value as Promise<V>
  }
  return Promise.resolve(value)
}

const checkStorage = (storageCandidate: any) => {
  if (typeof storageCandidate.getItem !== 'function') {
    console.error(
      '[use-eazy-auth] Invalid storage backend, it lacks function getItem, no storage will be used'
    )
    return false
  }
  if (typeof storageCandidate.setItem !== 'function') {
    console.error(
      '[use-eazy-auth] Invalid storage backend, it lacks function setItem, no storage will be used'
    )
    return false
  }
  if (typeof storageCandidate.removeItem !== 'function') {
    console.error(
      '[use-eazy-auth] Invalid storage backend, it lacks function removeItem, no storage will be used'
    )
    return false
  }
  return true
}

export interface AuthStorage<A = any, R = any> {
  getTokens(): Promise<AuthTokens<A, R>>
  setTokens(tokens: AuthTokens<A, R>): Promise<void>
  removeTokens(): Promise<void>
}

/**
 * makeStorage creates a wrapper around a compatible StorageLike object
 * The wrapper solves two tasks
 * - serialize and deserialize the token bag to string
 * - return a consistent Promise-base interface towards the store
 *     in particular, some stores like ReactNative AsyncStorage are asynchronous,
 *     while window.localStorage is synchronous, we want to uniform these behaviours
 * @param {StorageBackend} givenStorageBackend
 * @param {string} storageNamespace
 */
export function makeStorage<A, R>(
  givenStorageBackend: StorageBackend | false | undefined,
  storageNamespace: string,
): AuthStorage<A, R> {
  let storageBackend = noopStorageBackend
  if (
    typeof givenStorageBackend === 'undefined' ||
    givenStorageBackend === null
  ) {
    if (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    ) {
      // If provided by environment use local storage
      storageBackend = window.localStorage
    }
  } else if (
    givenStorageBackend !== false &&
    checkStorage(givenStorageBackend)
  ) {
    // When given use provided storage backend
    storageBackend = givenStorageBackend
  }

  const getTokens = (): Promise<AuthTokens> => {
    return getResolvedOrPromise(storageBackend.getItem(storageNamespace)).then(
      (rawTokens) => {
        // Empty storage...
        if (typeof rawTokens !== 'string') {
          return Promise.reject()
        }
        try {
          const parsedTokens = JSON.parse(rawTokens)
          if (
            typeof parsedTokens === 'object' &&
            parsedTokens !== null &&
            parsedTokens.accessToken
          ) {
            // TODO: Maybe validate in more proper way the content of local storeage....
            return Promise.resolve(parsedTokens)
          }
          return Promise.reject()
        } catch (e) {
          // BAD JSON
          return Promise.reject()
        }
      }
    )
  }

  const setTokens = (tokens: AuthTokens) => {
    return getResolvedOrPromise(
      storageBackend.setItem(storageNamespace, JSON.stringify(tokens))
    )
  }

  const removeTokens = () => {
    return getResolvedOrPromise(storageBackend.removeItem(storageNamespace))
  }

  return {
    setTokens,
    removeTokens,
    getTokens,
  }
}
