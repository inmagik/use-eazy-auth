import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Switch, Route, useHistory } from 'react-router-dom'
import Auth, { useAuthActions } from '../../index'
import { AuthRoute, GuestRoute } from '../index'
import { AuthTokens } from 'src/types'

interface TestCallBack<V = any> {
  (value: V): void
}

interface DummyUser {
  username: string
}

interface DummyLoginCredentials {
  username: string
  password: string
}

function Home() {
  return <div data-testid="home">Home</div>
}

function SpinnyBoy() {
  return <div data-testid="spinner">Spinny</div>
}

function Anon() {
  return <div data-testid="anon">Anon</div>
}

describe('AuthRoutes', () => {
  describe('<AuthRoute />', () => {
    it('should render content when user is authenticated', async () => {
      const loginCall = jest.fn()

      let resolveMe: TestCallBack<DummyUser>
      const meCall = jest.fn(
        () =>
          new Promise<DummyUser>((resolve) => {
            resolveMe = resolve
          })
      )

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/home']} initialIndex={0}>
            <Switch>
              <AuthRoute spinner={<SpinnyBoy />} path={'/home'}>
                <Home />
              </AuthRoute>
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
      })

      // Me Call
      await act(async () => {
        resolveMe({ username: 'GenGar' })
      })

      // No Spinnry
      expect(queryAllByTestId('spinner')).toEqual([])
      // Ma Home
      expect(getByTestId('home').textContent).toEqual('Home')
    })

    it('should redirect when user is not authenticated', async () => {
      const loginCall = jest.fn()

      const meCall = jest.fn()

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <div data-testid="main">
            <MemoryRouter initialEntries={['/home']} initialIndex={0}>
              <Switch>
                <Route path="/4n0n">
                  <Anon />
                </Route>
                <AuthRoute redirectTo="/4n0n" spinner={'Spinny'} path={'/home'}>
                  <Home />
                </AuthRoute>
              </Switch>
            </MemoryRouter>
          </div>
        </Auth>
      )

      const { getByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('main').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](null)
      })

      // Anon page
      expect(getByTestId('anon').textContent).toEqual('Anon')
    })

    it('should redirect based un test function', async () => {
      const loginCall = jest.fn()

      let resolveMe: TestCallBack<DummyUser>
      const meCall = jest.fn(
        () =>
          new Promise<DummyUser>((resolve) => {
            resolveMe = resolve
          })
      )

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      function Gengar() {
        const history = useHistory()
        const { updateUser } = useAuthActions()
        return (
          <div>
            <button
              onClick={() => {
                updateUser({ username: 'Rinne' })
                history.push('/home')
              }}
              data-testid="gengar-btn"
            >
              K
            </button>
          </div>
        )
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/home']} initialIndex={0}>
            <Switch>
              <AuthRoute path="/gengar">
                <Gengar />
              </AuthRoute>
              <AuthRoute
                redirectTest={(user) =>
                  user.username === 'GenGar' ? '/gengar' : null
                }
                spinnerComponent={SpinnyBoy}
                path={'/home'}
              >
                <Home />
              </AuthRoute>
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
      })

      // Me Call
      await act(async () => {
        resolveMe({ username: 'GenGar' })
      })

      expect(getByTestId('gengar-btn').textContent).toEqual('K')

      fireEvent.click(getByTestId('gengar-btn'))

      expect(getByTestId('home').textContent).toEqual('Home')
    })
  })

  describe('<GuestRoute />', () => {
    it('should render content when user in unauthenticated', async () => {
      const loginCall = jest.fn()

      const meCall = jest.fn().mockRejectedValue('Bu')

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      function Guest() {
        return <div data-testid="guest">Guest</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/guest']} initialIndex={0}>
            <Switch>
              <GuestRoute spinner={<SpinnyBoy />} path="/guest">
                <Guest />
              </GuestRoute>
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](null)
      })

      // No Spinny
      expect(queryAllByTestId('spinner')).toEqual([])
      // Show Guest
      expect(getByTestId('guest').textContent).toEqual('Guest')
    })

    it('should redirect to given location when user is authenticated', async () => {
      const loginCall = jest.fn()

      const meCall = jest.fn().mockResolvedValue({
        username: 'Gio Va',
      })

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      function Guest() {
        return <div data-testid="guest">Guest</div>
      }

      function Other() {
        return <div data-testid="other">Other</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/guest']} initialIndex={0}>
            <Switch>
              <GuestRoute
                redirectTo="/other"
                spinner={<SpinnyBoy />}
                path="/guest"
              >
                <Guest />
              </GuestRoute>
              <Route path="/other">
                <Other />
              </Route>
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
      })

      // No Spinny
      expect(queryAllByTestId('spinner')).toEqual([])
      // No Guest
      expect(queryAllByTestId('guest')).toEqual([])
      // Show Other
      expect(getByTestId('other').textContent).toEqual('Other')
    })

    it('should redirect to referrer', async () => {
      const loginCall = jest
        .fn<Promise<AuthTokens<number>>, [DummyLoginCredentials]>()
        .mockResolvedValue({
          accessToken: 99,
        })

      const meCall = jest.fn<Promise<DummyUser>, [number]>().mockResolvedValue({
        username: 'Gio Va',
      })

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      function Guest() {
        const { login } = useAuthActions<
          number,
          never,
          DummyUser,
          DummyLoginCredentials
        >()

        return (
          <div>
            <div data-testid="guest">Guest</div>
            <button
              onClick={() => {
                // <3
                login({
                  username: 'trizero',
                  password: 'trizero2077',
                })
              }}
              data-testid="login-btn"
            >
              Log Me In
            </button>
          </div>
        )
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/my-home-is-cool']} initialIndex={0}>
            <Switch>
              <GuestRoute
                redirectTo="/other"
                spinner={<SpinnyBoy />}
                path="/guest"
              >
                <Guest />
              </GuestRoute>
              <AuthRoute
                spinner={<SpinnyBoy />}
                redirectTo="/guest"
                path="/my-home-is-cool"
              >
                <Home />
              </AuthRoute>
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](null)
      })

      // No Spinny
      expect(queryAllByTestId('spinner')).toEqual([])

      // Log Me In!
      await act(async () => {
        fireEvent.click(getByTestId('login-btn'))
      })
      expect(getByTestId('home').textContent).toEqual('Home')
    })

    it('should redirect to referrer unless is set to false', async () => {
      const loginCall = jest
        .fn<Promise<AuthTokens<number>>, [DummyLoginCredentials]>()
        .mockResolvedValue({
          accessToken: 99,
        })

      const meCall = jest.fn<Promise<DummyUser>, [number]>().mockResolvedValue({
        username: 'Gio Va',
      })

      // Fake stroage
      const resolvesGetItem: TestCallBack[] = []
      const localStorageMock = {
        getItem: jest.fn(() => new Promise((r) => resolvesGetItem.push(r))),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      }
      Object.defineProperty(global, '_localStorage', {
        value: localStorageMock,
        writable: true,
      })

      function Guest() {
        const { login } = useAuthActions<
          number,
          never,
          DummyUser,
          DummyLoginCredentials
        >()

        return (
          <div>
            <div data-testid="guest">Guest</div>
            <button
              onClick={() => {
                // <3
                login({
                  username: 'trizero',
                  password: 'trizero2077',
                })
              }}
              data-testid="login-btn"
            >
              Log Me In
            </button>
          </div>
        )
      }

      function Other() {
        return <div data-testid="other">Other</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/my-home-is-cool']} initialIndex={0}>
            <Switch>
              <GuestRoute
                redirectToReferrer={false}
                redirectTo="/other"
                spinner={<SpinnyBoy />}
                path="/guest"
              >
                <Guest />
              </GuestRoute>
              <Route path='/other'>
                <Other />
              </Route>
              <AuthRoute
                spinner={<SpinnyBoy />}
                redirectTo="/guest"
                path="/my-home-is-cool"
              >
                <Home />
              </AuthRoute>
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0](null)
      })

      // No Spinny
      expect(queryAllByTestId('spinner')).toEqual([])

      await act(async () => {
        fireEvent.click(getByTestId('login-btn'))
      })

      // Show other
      expect(getByTestId('other').textContent).toEqual('Other')
    })
  })
})
