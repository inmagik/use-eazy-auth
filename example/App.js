import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import Auth, { useAuthState, useAuthActions, useAuthUser } from 'use-eazy-auth'
import { GuestRoute, AuthRoute, MaybeAuthRoute } from 'use-eazy-auth/routes'

const loginCall = ({ username, password }) =>
  new Promise((resolve, reject) =>
    username === 'giova' && password === 'xiboro23'
      ? resolve({ accessToken: 23, refreshToken: 777 })
      : reject({ status: 401, error: 'Go out' })
  )

const meCall = (token) =>
  new Promise((resolve, reject) =>
    token === 23
      ? resolve({ username: 'giova', status: 'Awesome', age: 17 })
      : reject({ status: 401, error: 'Go out' })
  )

const refreshTokenCall = (token) =>
  new Promise((resolve, reject) => {
    console.log('Refresh!', token)
    const newToken = 2323
    return token === 777
      ? resolve({ accessToken: newToken, refreshToken: 777 })
      : reject({ status: 401, error: 'Go out' })
  })

const authenticatedGetTodos = (token) => (category) =>
  new Promise((resolve, reject) => {
    console.log('API Token', token)
    console.log('Todos OF', category)
    return token === 23
      ? resolve(['Learn React', 'Prepare the dinner'])
      : reject({ status: 401, error: 'Go out' })
  })

const Login = () => {
  const { loginLoading, loginError } = useAuthState()
  const { login, clearLoginError } = useAuthActions()

  // login credentials state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // clear login error on unmount
  useEffect(() => () => clearLoginError(), [clearLoginError])

  // clear login error when username or password changes
  useEffect(() => {
    clearLoginError()
  }, [username, password, clearLoginError])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (username !== '' && password !== '') {
          login({ username, password })
        }
      }}
    >
      <code>
        username: giova
        <br />
        password: xiboro23
      </code>
      <div>
        <input
          placeholder="@username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button disabled={loginLoading}>
        {!loginLoading ? 'Login!' : 'Logged in...'}
      </button>
      {loginError && <div>Bad combination of username and password</div>}
    </form>
  )
}

const Home = () => {
  const [todos, setTodos] = useState([])
  const { user } = useAuthUser()
  const { logout, callAuthApiPromise } = useAuthActions()

  useEffect(() => {
    callAuthApiPromise(authenticatedGetTodos, 'all').then((todos) =>
      setTodos(todos)
    )
  }, [callAuthApiPromise])

  return (
    <div>
      <h1>
        Welcome Back! {user.username} u are {user.status}!
      </h1>
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

function About() {
  const { user } = useAuthUser()
  const { logout } = useAuthActions()
  return (
    <div>
      <h1>Eazy Auth Was Good</h1>
      {user && <h2>Bella {user.username}</h2>}

      <button onClick={logout}>Logout</button>
    </div>
  )
}

// const Screens = () => {
//   const { authenticated, bootstrappedAuth } = useAuthState()
//   if (!bootstrappedAuth) {
//     return <div>Just logged in wait....</div>
//   }
//   return authenticated ? <Home /> : <Login />
// }

const Menu = () => {
  const { user } = useAuthUser()
  const { patchUser } = useAuthActions()

  return (
    <div>
      <Link to={'/'}>Home</Link>
      {' | '}
      <Link to={'/about'}>About</Link>
      {' | '}
      <Link to={'/adult'}>18+</Link>
      {' | '}
      <Link to={'/login'}>Login</Link>
      {' | '}
      {user && (
        <span>
          {'~'}
          <i>{user.username}</i> Age: {user.age}{' '}
          <button
            onClick={() =>
              patchUser({
                age: user.age + 1,
              })
            }
          >
            +
          </button>{' '}
          <button
            onClick={() =>
              patchUser({
                age: user.age - 1,
              })
            }
          >
            -
          </button>
        </span>
      )}
    </div>
  )
}

const Adult = () => {
  console.log('Render Adult')
  return (
    <div>
      <h2>Only Adult Here ;)</h2>
    </div>
  )
}

const isAdult = (user) => (user.age >= 18 ? false : '/about')

const App = () => (
  <Auth
    loginCall={loginCall}
    meCall={meCall}
    refreshTokenCall={refreshTokenCall}
    onLogout={() => console.info('onLogout')}
  >
    <Router>
      <Menu />
      <GuestRoute path="/login">
        <Login />
      </GuestRoute>
      <AuthRoute
        path="/adult"
        redirectTest={(user) => (user.age >= 18 ? false : '/about')}
      >
        <Adult />
      </AuthRoute>
      <AuthRoute path="/" exact>
        <Home />
      </AuthRoute>
      <MaybeAuthRoute path="/about" exact>
        <About />
      </MaybeAuthRoute>
    </Router>
  </Auth>
)

export default App
