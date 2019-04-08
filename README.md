# use-eazy-auth
[![Build Status](https://api.travis-ci.com/gffuma/use-eazy-auth.svg?branch=master)](https://travis-ci.com/gffuma/use-eazy-auth/)
[![npm version](https://badge.fury.io/js/use-eazy-auth.svg)](https://www.npmjs.com/package/use-eazy-auth)

React hooks to handle common auth stuff.
The name came from [eazy-auth](https://github.com/inmagik/eazy-auth) because this was started as an excercise to rewrite the battle tested `eazy-auth` library using only React hooks without `redux` and `redux-saga`.

From `eazy-auth` inheriths some concepts and patterns.

## Warning
Still under heavy development, API may change in upcoming releases.

## Install
```
yarn add use-eazy-auth
npm install --save use-eazy-auth
```

## Api

### <Auth />

The main entry point where you have to configure your authentication behaviours.

`eazy-auth` use your provided `loginCall` to authenticated your user from given credentials, `loginCall` must be a function that return a `Promise` that resolves a valid `access token`.

After grabbing the access token from `loginCall` `eazy-auth` call the `meCall` with this
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

### useAuthState

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


const Login = () => {
  const { loginLoading, loginError } = useAuthState()
  const { login, clearLoginError } = useAuthActions()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form onSubmit={e => {
      e.preventDefault()
      if (username !== '' && password !== '') {
        login({ username, password })
      }
    }}>
      <div>
        <input
          placeholder='@username'
          type='text'
          value={username}
          onChange={e => {
            clearLoginError()
            setUsername(e.target.value)
          }}
        />
      </div>
      <div>
        <input
          placeholder='password'
          type='password'
          value={password}
          onChange={e => {
            clearLoginError()
            setPassword(e.target.value)
          }}
        />
      </div>
      <button disabled={loginLoading}>{!loginLoading ? 'Login!' : 'Logged in...'}</button>
      {loginError && <div>Bad combination of username and password</div>}
    </form>
  )
}
```

### useAuthActions

A `hook` that return actions to interact with auth.

```js
const authenticatedGetTodos = (category, token) => new Promise((resolve, reject) => {
  return (token === 23)
    ? resolve([
      'Learn React',
      'Prepare the dinner',
    ])
    : reject({ status: 401, error: 'Go out' })
})

const Home = () => {
  const [todos, setTodos] = useState([])
  const { logout, callApi } = useAuthActions()

  useEffect(() => {
    // callApi curry the current access token at last argument
    // and logout when the api fn rejects status === 401
    callApi(authenticatedGetTodos, 'all').then(todos => setTodos(todos))
  }, [
    callApi // <-- callApi don't changes between render so you can safely put it as deps of useEffect
            //  but you can also use callApi outside hooks such in an event handler:
            // onClick={() => callApi(authenticatedGetTodos, 'all').then(todos => setTodos(todos))}
  ])

  return (
    <div>
      <h2>Todos</h2>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
      <div>
        // the logout action also clear the token saved in storage
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  )
}
```

### useAuthUser

A `hook` that return current auth user and access token.

```js

import { useAuthUser } from 'use-eazy-auth'

const Home = () => {
  const { user, token } = useAuthUser()

  return (
    <div>
      Ma men {user.username} <br />
      <div>With token {token}</div>
    </div>
  )
}

```

## Run example
```
yarn dev
```


## Todos

- [ ] useLogin
- [ ] refresh token logic
- [ ] Routes for `react-router` as `eazy-auth` does
- [ ] Improve tests
- [ ] Improve docs
- [ ] Wait for React 16.9
- [ ] Maybe hocs :O
