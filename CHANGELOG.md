
## 2.6.0

##### *July 20th, 2022*

Make call rejection `401` checks working out of the box with library like [axios](https://axios-http.com).

Istead of checks only:
```js
error.status === 401
```
Checks also on response:
```js
error.response.status === 401
```

Internally also moved the checks as an helper so in future releases can will be able to be passed as configuration option.


## 2.5.0

##### *April 04th, 2022*

Support React 18 strict effects with reusable state for more info [see](https://github.com/reactwg/react-18/discussions/18)

### :zap: New features

#### `useAuthCallObservable()` and `useAuthCallPromise()`

These hooks make less cumberstone the integration with other fetching library.
These hooks take a curried token effect fuction and return the same function with a less order.

Here's the typings:
```ts
type CurryAuthApiFnPromise<A = any, O = any, FA extends any[] = any[]> = (
  accessToken: A
) => (...args: FA) => Promise<O>

type CurryAuthApiFn<A = any, O = any, FA extends any[] = any[]> = (
  accessToken: A
) => (...args: FA) => Observable<O> | Promise<O>

function useAuthCallObservable<A, O, FA extends any[]>(
  fn: CurryAuthApiFn<A, O, FA>
): (...args: FA) => Observable<O>

function useAuthCallPromise<A, O, FA extends any[]>(
  fn: CurryAuthApiFnPromise<A, O, FA>
): (...args: FA) => Promise<O>
```

An example:

```ts
function getProducts(token: string) {
  return (category: string) => fetch(`https://myapi/prodcuts/${category}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(r => r.ok ? Promise.reject(r) : r.json() as Promise<Product[]>)
}

// (category: string) => Promise<Product[]>
const wrappedGetProducts = useAuthCallPromise(getProducts)
```

The integration with fething libraries is less cumberstone and more funnny:

```js
import { useQuery } from 'react-query'
import { useAuthCallPromise } from 'use-eazy-auth'

function useProducts() {
  return useQuery(
    ['products'],
    useAuthCallPromise(
      (token) => () =>
        fetch('https://myapi/prodcuts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
    )
  )
}
```


## 2.4.0

##### *November 02th, 2021*

Call `onLogout` with last user access token.

## 2.3.0
##### *March 10th, 2021*

Added optional `onAuthenticate` callback to `<Auth />`, inoked when is authenticated
by **use-eazy-auth**.

Signature:
```ts
(user: U, accessToken: A, fromLogin: boolean) => void
```

## 2.2.0
##### *February 1th, 2021*

Added optional `onLogout` callback to `<Auth />`, inoked when user explicit logout
(calling `logout` action) or is kicked out from `401` rejection in call api functions.

## 2.1.0
##### *January 20th, 2021*

Add `initialData` prop to `<Auth />`.
Useful in SSR scenario when you need to init auth state and avoid running initial side effects.

The `initialData` typing:

```ts
interface InitialAuthData<A = any, R = any, U = any>  {
  accessToken: A | null
  refreshToken?: R | null
  expires?: number | null
  user: U | null
}
```

## 2.0.0
##### *January 1th, 2021*

Types for `use-eazy-auth` :tada: !
Now `use-eazy-auth` is 100% typescript!

### :bangbang: Breaking changes

All Routes `use-eazy-auth/routes` now has two different props to configure spinners.
The `spinner` prop a `ReactNode` and a `spinnerComponent` prop a `ComponentType`.

```jsx
<AuthRoute path='/' exact spinner={<Spinner />}>
  <Dashboard />
</AuthRoute>
<GuestRoute path='/login' exact spinnerComponent={Spinner}>
  <Login />
</GuestRoute>
```

### :zap: New features

The `updateUser` function from `useAuthActions` can now acept a callback to
execute a functional update similar to React `useState`.

```js
const { updateUser } = useAuthActions()

updateUser(user => ({ ...user, age: user.age + 1 }))
```

A new component `AuthRoutesProvider` is available from `use-eazy-auth/routes`,
to configure common part of routes behaviours.
All options can be overridden locally.

Props availables:
```ts
interface AuthRoutesConfig<U = any> {
  guestRedirectTo?: string | Location<Dictionary>
  authRedirectTo?: string | Location<Dictionary>
  authRedirectTest?: (user: U) => string | null | undefined | Location
  spinner?: ReactNode
  spinnerComponent?: ComponentType
  rememberReferrer?: boolean
  redirectToReferrer?: boolean
}
```

```js
// All with the same spinner
<AuthRoutesProvider spinner={<Spinner />}>
  {/* ... */}
  {/* <CustomSpinner /> wins and so on... */}
  <AuthRoute path='/' exact spinner={<CustomSpinner />}>
    <Dashboard />
  </AuthRoute>
</AuthRoutesProvider>
```

## 1.4.0
##### *November 24th, 2020*

Add `setTokens` action to explict set new tokens:

```js
const { setTokens } = useAuthActions()
setTokens({ accessToken: 'NEW_TOKEN' })
// or (if you support refresh token in your use-eazy-auth conf)
setTokens({ accessToken: 'NEW_TOKEN', refreshToken: 'NEW_REFRESH' })
```

## 1.3.1
##### *October 27th, 2020*

Support React 17 in peerDependencies and bump some build packages, nothing changed.

## 1.3.0
##### *September 18th, 2020*

Fix bug that prevent retriggering login if previous login fail.

## 1.2.0
##### *August 28th, 2020*

### :heavy_exclamation_mark: DON'T INSTALL THIS VERSION
*This version is bugged fixed in 1.3.0, sorry.*

Fix bugged `redirectTest` in `<AuthRoute />` Component and document it.

## 1.1.0
##### *August 27th, 2020*

### :heavy_exclamation_mark: DON'T INSTALL THIS VERSION
*This version is bugged fixed in 1.3.0, sorry.*

Rewrite the internal logic of effects in RxJS now `loginCall`, `meCall` and `refreshTokenCall`
can return Rx Observable.

So you can use `rjxs/ajax` without `.toPromise()`.

All routes components can be rendered with all methods supported by `react-router`.

Now you can do:

```js
<AuthRoute path='/account'>
  <Account />
</AuthRoute>
```

## 1.0.0
##### *June 8th, 2020*

The api still the same of `1.0.0-rc2` published on *next* tag.

The only breaking change is the remove of `callApi()` *function* from
`useAuthActions()` hook, cause is less reliable of `callAuthApiPromise()` and
`callAuthApiObservable()`.
