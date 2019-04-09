import React, { useEffect, useState } from 'react'
import Auth, { useLogin, useAuthState, useAuthActions, useAuthUser } from 'use-eazy-auth'

const loginCall = ({ username, password }) => new Promise((resolve, reject) =>
  (username === 'giova' && password === 'xiboro23')
    ? resolve({ accessToken: 23, refreshToken: 777 })
    : reject({ status: 401, error: 'Go out' })
)

const meCall = token => new Promise((resolve, reject) =>
  (token === 2323)
    ? resolve({ username: 'giova', status: 'Awesome' })
    : reject({ status: 401, error: 'Go out' })
)

const refreshTokenCall = token => new Promise((resolve, reject) => {
  const newToken = 23
  return (token === 777)
    ? resolve({ accessToken: newToken, refreshToken: 777 })
    : reject({ status: 401, error: 'Go out' })
})

const authenticatedGetTodos = token => new Promise((resolve, reject) => {
  console.log('x', token)
  return (token === 23)
    ? resolve([
      'Learn React',
      'Prepare the dinner',
    ])
    : reject({ status: 401, error: 'Go out' })
})

// const Login = () => {
//   const {
//     handleSubmit,
//     username, password,
//     loginLoading, loginError,
//   } = useLogin()
//   return (
//     <form onSubmit={handleSubmit}>
//       <div><input placeholder='@username' type='text' {...username} /></div>
//       <div><input placeholder='password' type='password' {...password} /></div>
//       <button disabled={loginLoading}>{!loginLoading ? 'Login!' : 'Logged in...'}</button>
//       {loginError && <div>Bad combination of username and password</div>}
//     </form>
//   )
// }
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

const Home = () => {
  const [todos, setTodos] = useState([])
  const { user } = useAuthUser()
  const { logout, callApi } = useAuthActions()

  useEffect(() => {
    callApi(authenticatedGetTodos).then(todos => setTodos(todos))
  }, [callApi])

  return (
    <div>
      <h1>Welcome Back! {user.username} u are {user.status}!</h1>
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

const Screens = () => {
  const { authenticated, bootstrappedAuth } = useAuthState()
  if (!bootstrappedAuth) {
    return <div>Just logged in wait....</div>
  }
  return authenticated ? <Home /> : <Login />
}

const App = () => (
  <Auth
    loginCall={loginCall}
    meCall={meCall}
    refreshTokenCall={refreshTokenCall}
  >
    <Screens />
  </Auth>
)

export default App
