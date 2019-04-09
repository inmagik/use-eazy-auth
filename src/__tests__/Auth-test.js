import React, { useEffect, useState } from 'react'
import { render, fireEvent, cleanup, act } from 'react-testing-library'
import 'jest-dom/extend-expect'
import Auth from '../Auth'
import { useAuthActions, useAuthState, useAuthUser } from '../hooks'

// Util component to check da auth state
const WhatInMaAuth = () => {
  const { bootstrappedAuth, authenticated } = useAuthState()
  return (
    <div>
      <div data-testid="authenticated">
        {authenticated ? 'Authenticated' : 'Anon'}
      </div>
      <div data-testid="auth-booted">
        {!bootstrappedAuth ? 'Booting...' : 'Booted!'}
      </div>
    </div>
  )
}

// Util component to check current auth user
const MaHome = () => {
  const { user } = useAuthUser()
  const { logout } = useAuthActions()
  return (
    <div>
      Ma User <div data-testid="username">{user.username}</div>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

// Util login component
const Login = () => {
  const { login } = useAuthActions()
  const { loginLoading, loginError } = useAuthState()
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        login({ username: 'giova', password: 'xiboro23' })
      }}
    >
      <button data-testid="login-btn" disabled={loginLoading}>
        Login
      </button>
      {loginError && <div data-testid="login-error">{loginError}</div>}
    </form>
  )
}

afterEach(cleanup)

describe('Auth', () => {
  it('should check local storage and not auth user when nothing in local storage', async done => {
    // Fake da calls
    const loginCall = jest.fn()
    const meCall = jest.fn()

    // Fake an empty local storage
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <WhatInMaAuth />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    // After the inital render auth is in booting
    expect(getByTestId('auth-booted').textContent).toBe('Booting...')
    // ... And user not authenticated
    expect(getByTestId('authenticated').textContent).toBe('Anon')

    process.nextTick(() => {
      // ... Next tick promise have been resolved
      // Check local stroage to have been called \w the default key auth
      expect(window.localStorage.getItem).toHaveBeenLastCalledWith('auth')
      // Ok And now auth should be bootstrapped!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      // But use still anon
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      done()
    })
  })

  it('should check local storage and authenticate user when a valid token is provided', async done => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe
    const meCall = jest.fn(
      () =>
        new Promise(resolve => {
          resolveMe = resolve
        })
    )

    // Fake a good storage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ accessToken: 23 })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const Eazy = () => {
      const { authenticated } = useAuthState()
      return (
        <div>
          <WhatInMaAuth />
          {authenticated && <MaHome />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    // After the inital render auth is in booting
    expect(getByTestId('auth-booted').textContent).toBe('Booting...')
    // ... And user not authenticated
    expect(getByTestId('authenticated').textContent).toBe('Anon')

    process.nextTick(async () => {
      // ... Next tick promise have been resolved
      // Check local stroage to have been called \w the default key auth
      expect(window.localStorage.getItem).toHaveBeenLastCalledWith('auth')
      // Ok something is in storage auth still bootstrapping
      expect(getByTestId('auth-booted').textContent).toBe('Booting...')
      // And user still anon ...
      expect(getByTestId('authenticated').textContent).toBe('Anon')

      // No run the side effect of me...
      await act(async () => {
        resolveMe({ username: 'Gio Va' })
      })
      // Check me called
      expect(meCall).toHaveBeenLastCalledWith(23)
      // At this time ma men should be authenticated and auth booted!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      expect(getByTestId('authenticated').textContent).toBe('Authenticated')
      // eheh and now the user should be ma men gio va
      expect(getByTestId('username').textContent).toBe('Gio Va')
      done()
    })
  })

  it('should check local storage and not auth user when token is bad', async done => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let rejectMe
    const meCall = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          rejectMe = reject
        })
    )

    // Fake a good storage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ accessToken: 777 })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const Eazy = () => {
      const { authenticated } = useAuthState()
      return (
        <div>
          <WhatInMaAuth />
          {authenticated && <MaHome />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    // After the inital render auth is in booting
    expect(getByTestId('auth-booted').textContent).toBe('Booting...')
    // ... And user not authenticated
    expect(getByTestId('authenticated').textContent).toBe('Anon')

    process.nextTick(async () => {
      // ... Next tick promise have been resolved
      // Check local stroage to have been called \w the default key auth
      expect(window.localStorage.getItem).toHaveBeenLastCalledWith('auth')
      // Ok something is in storage auth still bootstrapping
      expect(getByTestId('auth-booted').textContent).toBe('Booting...')
      // And user still anon ...
      expect(getByTestId('authenticated').textContent).toBe('Anon')

      // No run the side effect of me...
      await act(async () => {
        // Reject ... bad token ...
        rejectMe('Bleah')
      })
      // Check me called
      expect(meCall).toHaveBeenLastCalledWith(777)
      // Auth boooted but still anono
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      done()
    })
  })

  it('should login and authenticate user', async done => {
    // Fake da calls
    // Manual trigger da login
    let resolveLogin
    const loginCall = jest.fn(
      () =>
        new Promise(resolve => {
          resolveLogin = resolve
        })
    )
    let resolveMe
    const meCall = jest.fn(
      () =>
        new Promise(resolve => {
          resolveMe = resolve
        })
    )

    // Fake an empty local storage
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const Eazy = () => {
      const { authenticated } = useAuthState()

      return (
        <div>
          <WhatInMaAuth />
          {!authenticated ? <Login /> : <MaHome />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    // After the inital render auth is in booting
    expect(getByTestId('auth-booted').textContent).toBe('Booting...')
    // ... And user not authenticated
    expect(getByTestId('authenticated').textContent).toBe('Anon')

    process.nextTick(async () => {
      // ... Next tick promise have been resolved
      // Check local stroage to have been called \w the default key auth
      expect(window.localStorage.getItem).toHaveBeenLastCalledWith('auth')
      // Ok And now auth should be bootstrapped!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      // But use still anon
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      // Time 2 Login!
      fireEvent.click(getByTestId('login-btn'))
      // Login performing button should be disabled heheheh
      expect(getByTestId('login-btn').disabled).toBe(true)
      // Run login side effect!!!
      await act(async () => {
        resolveLogin({ accessToken: 23 })
      })
      // Me not called login still loading
      expect(getByTestId('login-btn').disabled).toBe(true)
      // Run me effect!
      await act(async () => {
        resolveMe({ username: 'Gio Va' })
      })
      // Login call should be called
      expect(loginCall).toHaveBeenLastCalledWith({
        username: 'giova',
        password: 'xiboro23',
      })
      // At this time ma men should be authenticated and auth booted!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      expect(getByTestId('authenticated').textContent).toBe('Authenticated')
      // eheh and now the user should be ma men gio va
      expect(getByTestId('username').textContent).toBe('Gio Va')
      done()
    })
  })

  it('should not login when bad credentials', async done => {
    // Fake da calls
    // Manual trigger da login
    let rejectLogin
    const loginCall = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          rejectLogin = reject
        })
    )
    const meCall = jest.fn()

    // Fake an empty local storage
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const Eazy = () => {
      const { authenticated } = useAuthState()

      return (
        <div>
          <WhatInMaAuth />
          {!authenticated ? <Login /> : <MaHome />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    // After the inital render auth is in booting
    expect(getByTestId('auth-booted').textContent).toBe('Booting...')
    // ... And user not authenticated
    expect(getByTestId('authenticated').textContent).toBe('Anon')

    process.nextTick(async () => {
      // ... Next tick promise have been resolved
      // Check local stroage to have been called \w the default key auth
      expect(window.localStorage.getItem).toHaveBeenLastCalledWith('auth')
      // Ok And now auth should be bootstrapped!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      // But use still anon
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      // Time 2 Login!
      fireEvent.click(getByTestId('login-btn'))
      // Login performing button should be disabled heheheh
      expect(getByTestId('login-btn').disabled).toBe(true)
      // Run login side effect!!!
      await act(async () => {
        rejectLogin('Fuckk Offf')
      })
      // Finish login loading
      expect(getByTestId('login-btn').disabled).toBe(false)
      // Login call should be called
      expect(loginCall).toHaveBeenLastCalledWith({
        username: 'giova',
        password: 'xiboro23',
      })
      // At this time ma men should be authenticated and auth booted!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      // Check login error
      expect(getByTestId('login-error').textContent).toBe('Fuckk Offf')
      done()
    })
  })

  it('should logout an authenticated user', async done => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe
    const meCall = jest.fn(
      () =>
        new Promise(resolve => {
          resolveMe = resolve
        })
    )

    // Fake a good storage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ accessToken: 23 })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const Eazy = () => {
      const { authenticated } = useAuthState()
      return (
        <div>
          <WhatInMaAuth />
          {authenticated && <MaHome />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    // After the inital render auth is in booting
    expect(getByTestId('auth-booted').textContent).toBe('Booting...')
    // ... And user not authenticated
    expect(getByTestId('authenticated').textContent).toBe('Anon')

    process.nextTick(async () => {
      // ... Next tick promise have been resolved
      // Check local stroage to have been called \w the default key auth
      expect(window.localStorage.getItem).toHaveBeenLastCalledWith('auth')
      // Ok something is in storage auth still bootstrapping
      expect(getByTestId('auth-booted').textContent).toBe('Booting...')
      // And user still anon ...
      expect(getByTestId('authenticated').textContent).toBe('Anon')

      // Now run the side effect of me...
      await act(async () => {
        resolveMe({ username: 'Gio Va' })
      })
      // Check me called
      expect(meCall).toHaveBeenLastCalledWith(23)
      // At this time ma men should be authenticated and auth booted!
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      expect(getByTestId('authenticated').textContent).toBe('Authenticated')
      // eheh and now the user should be ma men gio va
      expect(getByTestId('username').textContent).toBe('Gio Va')
      // Goodye boy
      fireEvent.click(getByTestId('logout-btn'))
      // Should don'r remember ma men
      expect(getByTestId('auth-booted').textContent).toBe('Booted!')
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      // Should remove tokens
      expect(window.localStorage.removeItem).toHaveBeenLastCalledWith('auth')
      done()
    })
  })

  it('should provide a function to call api', async done => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe
    const meCall = jest.fn(
      () =>
        new Promise(resolve => {
          resolveMe = resolve
        })
    )
    const getUserStatus = jest.fn(
      () =>
        new Promise(resolve => {
          resolve('Awesome')
        })
    )

    // Fake a good storage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ accessToken: 23 })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const MaHomeCalled = () => {
      const { callApi } = useAuthActions()
      const [status, setStatus] = useState('')
      useEffect(() => {
        callApi(getUserStatus).then(setStatus)
      }, [callApi])

      return (
        <div>
          Status: <div data-testid="status">{status}</div>
        </div>
      )
    }

    const Eazy = () => {
      const { authenticated } = useAuthState()
      return (
        <div>
          <WhatInMaAuth />
          {authenticated && <MaHomeCalled />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    process.nextTick(async () => {
      // Auth booted

      // Now run the side effect of me...
      await act(async () => {
        resolveMe({ username: 'Gio Va' })
      })

      // The api fn provided should be called \w token
      expect(getUserStatus).toHaveBeenLastCalledWith(23)
      // Match response
      expect(getByTestId('status').textContent).toBe('Awesome')
      done()
    })
  })

  it('should provide a function to call api and logout when raise a 401 status code', async done => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe
    const meCall = jest.fn(
      () =>
        new Promise(resolve => {
          resolveMe = resolve
        })
    )
    const getUserStatus = jest.fn(
      () =>
        new Promise((resolve, reject) => {
          reject({ status: 401 })
        })
    )

    const getUserStatus2 = jest.fn(() => new Promise(resolve => resolve('XD')))

    // Fake a good storage
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify({ accessToken: 23 })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const MaHomeCalled = () => {
      const { callApi } = useAuthActions()
      const [status, setStatus] = useState('')
      useEffect(() => {
        callApi(getUserStatus).then(setStatus, () => {})
      }, [callApi])

      return (
        <div>
          Status: <div data-testid="status">{status}</div>
        </div>
      )
    }

    const BananaSplit = () => {
      const { callApi } = useAuthActions()
      return (
        <div>
          <button
            data-testid="btn-call"
            onClick={() => {
              callApi(getUserStatus2)
            }}
          >
            XD
          </button>
        </div>
      )
    }

    const Eazy = () => {
      const { authenticated } = useAuthState()
      return (
        <div>
          <WhatInMaAuth />
          <BananaSplit />
          {authenticated && <MaHomeCalled />}
        </div>
      )
    }

    const App = () => (
      <Auth loginCall={loginCall} meCall={meCall}>
        <Eazy />
      </Auth>
    )

    const { getByTestId } = render(<App />)

    process.nextTick(async () => {
      // Auth booted

      // Now run the side effect of me...
      await act(async () => {
        resolveMe({ username: 'Gio Va' })
      })

      // The api fn provided should be called \w token
      expect(getUserStatus).toHaveBeenLastCalledWith(23)

      // // Check perform logout
      expect(getByTestId('authenticated').textContent).toBe('Anon')
      expect(window.localStorage.removeItem).toHaveBeenLastCalledWith('auth')

      fireEvent.click(getByTestId('btn-call'))
      // Check callApi call with empty token...
      expect(getUserStatus2).toHaveBeenLastCalledWith(null)

      done()
    })
  })
})
