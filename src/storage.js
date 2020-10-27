const noopStorageBackend = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

// If a promise return them if other return the value as resolved promise ...
function getResolvedOrPromise(value) {
  // Check if a Promise...
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function'
  ) {
    return value
  }
  return Promise.resolve(value)
}

const checkStorage = (storageCandidate) => {
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

/**
 * makeStorage creates a wrapper around a compatible StorageLike object
 * The wrapper solves two tasks
 * - serialize and deserialize the token bag to string
 * - return a consistent Promise-base interface towards the store
 *     in particular, some stores like ReactNative AsyncStorage are asynchronous,
 *     while window.localStorage is synchronous, we want to uniform these behaviours
 * @param {any} givenStorageBackend
 * @param {string} storageNamespace
 */
export const makeStorage = (givenStorageBackend, storageNamespace) => {
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

  const getTokens = () => {
    return getResolvedOrPromise(storageBackend.getItem(storageNamespace)).then(
      (rawTokens) => {
        // Empty storage...
        if (typeof rawTokens !== 'string') {
          return Promise.reject()
        }
        try {
          // TODO: Check Keys of json...
          return Promise.resolve(JSON.parse(rawTokens))
        } catch (e) {
          // BAD JSON
          return Promise.reject()
        }
      }
    )
  }

  const setTokens = (tokens) => {
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
