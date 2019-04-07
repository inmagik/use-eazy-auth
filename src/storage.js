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

// Storage protocol:
// thinked 2 be always async (not now XD) will return Promises
// getTokens LS -> User
// setTokens User -> LS
// removeTokens rm -rf LS
export const makeStorage = (givenStorageBackend, storageNamespace) => {
  let storageBackend
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
    } else {
      // Use a noop storage backend (don't store anything)
      storageBackend = noopStorageBackend
    }
  } else {
    // When given use provided storage backend
    storageBackend = givenStorageBackend
  }

  const getTokens = () => {
    return getResolvedOrPromise(storageBackend.getItem(storageNamespace)).then(
      rawTokens => {
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

  const setTokens = tokens =>
    getResolvedOrPromise(
      storageBackend.setItem(storageNamespace, JSON.stringify(tokens))
    )

  const removeTokens = () =>
    getResolvedOrPromise(storageBackend.removeItem(storageNamespace))

  return {
    setTokens,
    removeTokens,
    getTokens,
  }
}
