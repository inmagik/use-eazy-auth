const noopStorageBackend = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
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
    // TODO: Implement Async
    const rawTokens = storageBackend.getItem(storageNamespace)
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

  const setTokens = tokens => {
    // TODO: Implement Async
    storageBackend.setItem(storageNamespace, JSON.stringify(tokens))
    return Promise.resolve()
  }

  const removeTokens = () => {
    // TODO: Implement Async
    storageBackend.removeItem(storageNamespace)
    return Promise.resolve()
  }

  return {
    setTokens,
    removeTokens,
    getTokens,
  }
}
