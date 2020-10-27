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