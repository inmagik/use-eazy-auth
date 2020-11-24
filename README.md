# use-eazy-auth
[![Build Status](https://travis-ci.com/inmagik/use-eazy-auth.svg?branch=master)](https://travis-ci.com/inmagik/use-eazy-auth)
[![npm version](https://badge.fury.io/js/use-eazy-auth.svg)](https://www.npmjs.com/package/use-eazy-auth)

React components and hooks to deal with token based authentication

This project takes the main concepts and algorithms (but also the name) from the [eazy-auth](https://github.com/inmagik/eazy-auth) library, and aims at providing equivalent functionality in contexts where the usage of `eazy-auth` with its strong dependency on `redux` and `redux-saga` is just too constraining.

## Installation
```
yarn add use-eazy-auth
npm install --save use-eazy-auth
```

## Api

### `<Auth />` Component
The top level component where you are able to configure authentication behaviours.

Token based authentication is based on the usage of a token as a proof of identity. As such, the library has to deal with acquiring a token, storing it for later use, validating it, refreshing it when it expires, and deleting it when no refresh is possible or the token is revoked.

Moreover, the token is strictly tied to a user (as it is the proof of his identity), and so it is usually a good idea to keep the user object around while the token is valid.

This concepts are common to the majority of token based authentication system, even if implementation of them can be really different. Given this, `use-eazy-auth` gives you full customization freedom to integrate with your specific implementation and to tailor its own behaviours by passing props to the `<Auth />` component.

The `<Auth />` component creates React contexts that are used by any hook, so it is mandatory to make it a common ancestor for all components that need to deal with authentication, and advisable to put it as near as possible to the root of the React application tree.

The following properties are required:
* **loginCall**: the login call implements the process of acquiring a valid token, usually by means of some credentials (in the majority of cases, this is just a *username*, *password* pair, but it is not required). The signature of this function must be

  ```js
    (credentials: any) =>
      Promise<{ accessToken: string, refreshToken?: string }, any> |
      Observable<{ accessToken: string, refreshToken?: string }, any>
  ```

  Has you can see, the function is expected to return a promise which rejects in case of unsuccessful authentication (the error shape is up to you) or resolves in case of successful authentication. The required `accessToken` property in the resolution argument must hold the token which will be used to authenticate the user when interacting with the server. The optional `refreshToken` property, if present, must hold a token which is never used for API calls, but it is used to get a new token when that returned by the login expires without having the user go through the login procedure again. In case the access token expires and no refresh is possible, the user will experience a forced logout

* **meCall**: the me call implements the process of validating a previously stored token while gathering information about the owner user. This is used both to read user information from server and make them available throughout the application and to validate a token that has been recalled after some time from storage (see later). The signature of this function must be

  ```js
    (accessToken: string) =>
      Promise<any, { status: number }> | Observable<any, { status: number }>
  ```

  Has you can see, this function is expected to retrieve user information given an access token. In case the process succeeds, it is expected to return the object that describes the user (the shape of this is again completely up to you). In case the process cannot succeed, the promise is expected to be rejected with a status code. In this last situation, the `accessToken` cannot be considered valid anymore.

  If a `refreshToken` was provided, `refreshTokenCall` is set on the `<Auth />` object and the error status code is 401, the library will attempt to refresh the token and eventually repeat the me call with the refreshed token. If for any reason the token cannot be refreshed the user will be logged out.

* **refreshTokenCall**: some authentication schemes allow the usage of some kind of refresh token to obtain a fresh access token when the currently used one expires. This property allows to pass a function that implements the refresh procedure. As such, its signature is

  ```js
    (refreshToken: string) =>
      Promise<{ accessToken: string, refreshToken?: string }, any> |
      Observable<{ accessToken: string, refreshToken?: string }, any>
  ```

  Considerations about the login call hold just the same for this api, the only difference is that the `credentials` parameter is replaced by the `refreshToken`

* **storageBackend**: the storage of `accessToken` and `refreshToken` allows the website to remember the user identity and to skip the authentication procedure in a subsequent visit. You are free to choose any synchronous or asynchronous storage backend like `localStorage`, `sessionStorage` (or `AsyncStorage` when using ReactNative). A storage object must meet the following signature

  ```js
    type Storage = {
      getItem: (key: string) => string | Promise<string, any>,
      setItem: (key: string, value: string) => void | Promise<void, any>,
      removeItem: (key: string) => void | Promise<void, any>
    }
  ```

  This property defaults to `window.localStorage` if available, or to `no storage` otherwise. In case you want to completely disable token storage, set this property to `false`

* **storageNamespace**: in case you did not opt-out token storage, you can customize the key under which the tokens are stored by setting this property (it must be a string). If you don't set this property, it defaults to the string `auth`

Here is a usage example

> Please note that the login call and the me call are **not** real life examples: always validate your users against your authentication backend!

```js
import React from 'react'
import Auth from 'use-eazy-auth'

const loginCall = ({ username, password }) => new Promise((resolve, reject) =>
  (username === 'alice' && password === 'my-super-secret-password')
    ? resolve({ accessToken: 'alice-is-allowed-to-access' })
    : reject('Unauthorized!')
)

const meCall = token => new Promise((resolve, reject) =>
  (token === 'alice-is-allowed-to-access')
    ? resolve({ username: 'alice', status: 'Administrator' })
    : reject('Unauthorized!')
)

const App = () => (
  <Auth
    loginCall={loginCall}
    meCall={meCall}
    storageBackend={storageBackend}
    storageNamespace='my-auth'
  >
    {
      /* react-router or in any case the restricted section of
       * your application should be put here
       */
    }
    <Screens />
  </Auth>
)

```

You can also use the `render` prop.

```js
function App() {
  return (
    <Auth
      loginCall={loginCall}
      meCall={meCall}
      storageBackend={storageBackend}
      storageNamespace='my-auth'
      render={(authActions, authState, userState) => /* render my children */}
    />
  )
}
```

### `useAuthState()` hook

This hooks returns the current auth state. The auth state is the operational state of the library, which can tell you if some operation is in progress, like initialization or login. The state object is a plain object with the following properties

* **bootstrappedAuth** (bool): this flag tells whether the library has loaded or loading is still in progress. Loading means that the library is fetching stored tokens and validating them with a me call.
* **authenticated** (bool): this flag tells whether the user is authenticated (i.e. the library has a valid access token ready for use) or not
* **loginLoading** (bool): this flag tells whether a login operation is in progress
* **loginError** (any): this property holds the result of the last rejected promise (it is not cleared after a successful login call, you need to clear it explictly by calling `clearLoginError` - see example)

Usage example

```jsx
import React, { useState } from 'react'
import { useAuthState, useAuthActions } from 'use-eazy-auth'

const Screens = () => {
  const { authenticated, bootstrappedAuth } = useAuthState()
  if (!bootstrappedAuth) {
    return <div>Please wait, we are logging you in...</div>
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

### `useAuthActions()` hook
This hook allows to invoke some auth related behaviours. It returns a plain JavaScript object whose properties are functions.

* **callAuthApiPromise**
  This function performs an authenticated API call. The first parameter is a factory function (a function which returns a fucntion) that is expected to create the real api call function (i.e. the function that implements the real api call, you can use XHR, Axios, SuperAgent or whatever you like inside this). The factory function is invoked with the access token, and is expected to return again a function - the api call function. Any additional parameter supplied to the **callAuthApiPromise** will be used as a parameter to invoke the api call function. The api call must return a promise. If all is fine, that promise is expected to resolve. In case it rejects, the rejection value must be an object with a status property carrying the status code of the request. A 401 code will trigger the refresh token operation (if available) and repeat the api call invocation with the new token. If even this second call is rejected, the user will be logged out.

* **callAuthApiObservable**
  This behaves like **callAuthApiPromise** except that the api call function is expected to return an `Observable` from `RxJS`. Promise rejection is replaced by error raising.

* **login**
  This function triggers a login operation. It is expected to be called with a single argument (the credentials object) which is used to invoke the `loginCall` provided to the `<Auth />` component as a property

* **logout**
  This function triggers a logout operation. This means clearing the stored tokens and set the library `authenticated` state to `false`. No api call is performed here.

* **clearLoginError**
  This function clear the current login error.

* **updateUser**
  This function update the current auth user with given *User* object.

* **patchUser**
  This function shallow merge the given *User* object with current *User* object.

* **setTokens**
  ```js
    ({ accessToken: string, refreshToken?: string }) => void
  ```
  This function explicit set new tokens, this function write new tokens in storage as well.

All these functions are stable across renders, so it is safe to add them as dependencies of some `useEffect` or `useMemo`, they will never trigger any unnecessary re-renders.

Here is some example

```js
import React, { useState, useEffect } from 'react'
import { useAuthActions } from 'use-eazy-auth'

const authenticatedGetTodos = (token) => (category) => new Promise((resolve, reject) => {
  return (token === 23)
    ? resolve([
      'Learn React',
      'Prepare the dinner',
    ])
    : reject({ status: 401, error: 'Go out' })
})

const Home = () => {
  const [todos, setTodos] = useState([])
  const { logout, callAuthApiPromise } = useAuthActions()

  useEffect(() => {
    callAuthApiPromise(authenticatedGetTodos, 'all')
      .then(todos => setTodos(todos))
  }, [callAuthApiPromise])

  return (
    <div>
      <h2>Todos</h2>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
      <div>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  )
}
```

### `useAuthUser()` hook
This hook returns the current user object (in the shape you chose to return from the `meCall` supplied to the `<Auth />` component) and the current token as props of a plain JavaScript object. If user is not logged in, both properties result in `null` values.

```js

import { useAuthUser } from 'use-eazy-auth'

const Home = () => {
  const { user, token } = useAuthUser()

  return (
    <div>
      Logged in user {user.username} <br />
      identified by token {token}
    </div>
  )
}
```

## React Router Integration
This library ships with components useful to integrate routing (by react-router) and authentication. You are not forced to do this: you can use any routing library you wish and write the integration yourself, maybe taking our react-router integration as an example

The integration is done by providing three specialized `Route` components: `GuestRoute`, `AuthRoute` and `MaybeAuthRoute`. A `GuestRoute` can be accessed only by non authenticated users, and will redirect authenticated users. An `AuthRoute` can be accessed just by authenticated users, and will redirect any non authenticated visitor. A `MaybeAuthRoute` will accept authenticated just as non authenticated users. If in some route you don't care about authentication, a vanilla `Route` can still be used.

You can import those components from `use-eazy-auth/routes`

### `<GuestRoute />` component
The `<GuestRoute />` component accepts the following props

* **children**: the react element to render if user is not authenticated
* **component**: the component to render if user is not authenticated
* **render**: the function to render if user is not authenticated
* **redirectTo**: the path to redirect authenticated users to
* **redirectToReferrer**: if set to `true`, users that are redirected to this page from an `<AuthRoute />` because they are not authenticated will be redirected back after login instead of being redirected to the path set by `redirectTo`. Note that it is mandatory to set the `redirectTo` property as unauthenticated users may land directly on a `GuestRoute` and so they may not have a referrer
* **spinner**: an optional spinner component to render while the login call is pending instead of `component`
* any other property accepted by `<Route />`

### `<AuthRoute />` component
The `<AuthRoute />` component accepts the following props

* **children**: the react element to render if user is authenticated
* **component**: the component to render if user is authenticated
* **render**: the function to render if user is authenticated
* **redirectTo**: the path to redirect a non authenticated user to
* **rememberReferrer**: whether to enable the referrer in order to redirect the user back after login
* **redirectTest**: a function to test if current authenticated user can access your route, take user as only parameter and if falsy is returned the user can acccess the route, otherwise the return value is expected to be a valid path used to redirect the user.
* **spinner**: an optional spinner to render instead of `component` until the auth initialization is not complete
* any other property accepted by `<Route />`

### `<MaybeAuthRoute />` component
The `<AuthRoute />` component accepts the following props

* **children**: the react element to render
* **component**: the component to render
* **render**: the function to render
* **spinner**: an optional spinner to render instead of `component` until the auth initialization is not complete
* any other property accepted by `<Route />`

## Run example
This repository contains a runnable basic example of the main functionalities of the library

```sh
git clone https://github.com/inmagik/use-eazy-auth.git
cd use-eazy-auth
yarn install
yarn dev
```