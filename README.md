# use-eazy-auth

React hooks to handle common auth stuff.
The name came from [eazy-auth](https://github.com/inmagik/eazy-auth) because this was started as an excercise to rewrite the battle tested `eazy-auth` library using only React hooks without `redux` and `redux-saga`.
From `eazy-auth` inheriths some concepts and patterns.

## Warning
Still under heavy development, API may change in upcoming releases.


## Api

### <Auth />

The main entry point where you have to configure your authentication behaviours.
`eazy-auth` use your provided `loginCall` to authenticated your user from
given credentials, `loginCall` must be a function that return a `Promise` that resolves
a valid `access token` from given credentials you choice.
After grabbing      the access token from `loginCall` `eazy-auth` call the `meCall` with this
`access token` and if the `meCall` resolves `eazy-auth` authenticate the user and store
the valid `access token` using the given `storageBackend`.
When the `Auth` Component mounts check if the storage contains the `access token` and
use the `meCall` to check if the `user` is still authenticated.


```js
import Auth from 'use-eazy-auth'

const loginCall = ({ username, password }) => new Promise((resolve, reject) =>
  (username === 'giova' && password === 'xiboro23')
    ? resolve({ accessToken: 23 })
    : reject('Go out!')
)

const meCall = token => new Promise((resolve, reject) =>
  (token === 23)
    ? resolve({ username: 'giova', status: 'Awesome' })
    : reject('Go out!')
)

const App = () => (
  <Auth
    loginCall={loginCall}
    meCall={meCall}
    // default localStorage set false to disabled the storage of tokens
    storageBackend={storageBackend}
    // the namespace where store atuh data
    storageNamespace='auth'
  >
    <Screens />
  </Auth>
)

```

## useAuthState

A `hook` that return the current auth state.

```js
import { useAuthState } from 'use-eazy-auth'

const Screens = () => {
  const { authenticated, bootstrappedAuth } = useAuthState()
  if (!bootstrappedAuth) {
    return <div>Just logged in wait....</div>
  }
  return authenticated ? <Home /> : <Login />
}
```

## Todos

- [ ] useLogin
- [ ] refresh token logic
- [ ] Routes for `react-router` as `eazy-auth` does
- [ ] Improve tests
- [ ] Improve docs
- [ ] Wait for React 16.9
- [ ] Maybe hocs :O
