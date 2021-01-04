import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { Link, MemoryRouter, Route, Switch, useHistory } from 'react-router-dom'
import { AuthTokens } from 'src/types'
import Auth, { useAuthActions } from '../../index'
import { AuthRoute, GuestRoute, MaybeAuthRoute } from '../index'
import AuthRoutesProvider from '../AuthRoutesProvider'

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

    it('should redirect default to "/login" when user is not authenticated', async () => {
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

      function Login() {
        return <form data-testid="login">Login</form>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <div data-testid="main">
            <MemoryRouter initialEntries={['/home']} initialIndex={0}>
              <Switch>
                <Route path="/4n0n">
                  <Anon />
                </Route>
                <GuestRoute path="/login">
                  <Login />
                </GuestRoute>
                <AuthRoute spinner={'Spinny'} path={'/home'} component={Home} />
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
      expect(getByTestId('login').textContent).toEqual('Login')
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
                <AuthRoute
                  redirectTo="/4n0n"
                  spinner={'Spinny'}
                  path={'/home'}
                  component={Home}
                />
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
    it('should render content when user is unauthenticated', async () => {
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

    it('should redirect default to "/" when user is authenticated', async () => {
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

      function MaHome() {
        return <div data-testid="home">MaHome</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/guest']} initialIndex={0}>
            <Switch>
              <GuestRoute spinner={<SpinnyBoy />} path="/guest">
                <Guest />
              </GuestRoute>
              <Route path="/other">
                <Other />
              </Route>
              <AuthRoute path="/" exact>
                <MaHome />
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

      // No Spinny
      expect(queryAllByTestId('spinner')).toEqual([])
      // No Guest
      expect(queryAllByTestId('guest')).toEqual([])
      // No Other
      expect(queryAllByTestId('other')).toEqual([])
      // Show Home
      expect(getByTestId('home').textContent).toEqual('MaHome')
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
                component={Guest}
              />
              <Route path="/other">
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

  describe('<MaybeAuthRoute />', () => {
    it('should render content when user is unauthenticated ... but wait for boot', async () => {
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

      function Maybe() {
        return <div data-testid="maybe">Maybe</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/maybe']} initialIndex={0}>
            <Switch>
              <MaybeAuthRoute spinner={<SpinnyBoy />} path="/maybe">
                <Maybe />
              </MaybeAuthRoute>
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
      expect(getByTestId('maybe').textContent).toEqual('Maybe')
    })
    it('should render content when user is authenticated ... but wait for boot', async () => {
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

      function Maybe() {
        return <div data-testid="maybe">Maybe</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <MemoryRouter initialEntries={['/maybe']} initialIndex={0}>
            <Switch>
              <MaybeAuthRoute
                spinnerComponent={SpinnyBoy}
                path="/maybe"
                component={Maybe}
              />
            </Switch>
          </MemoryRouter>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      // Local storage
      await act(async () => {
        resolvesGetItem[0]({ accessToken: 23 })
      })

      // No Spinny
      expect(queryAllByTestId('spinner')).toEqual([])
      // Show Guest
      expect(getByTestId('maybe').textContent).toEqual('Maybe')
    })
  })

  describe('<AuthRoutesProvider />', () => {
    it('should configure global spinners', async () => {
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

      const NavBar = () => (
        <div>
          <Link data-testid="link-to-custom" to="/custom">
            Custom
          </Link>
          <Link data-testid="link-to-empty" to="/empty">
            Empty
          </Link>
          <Link data-testid="link-to-custom-component" to="/custom-component">
            CustomComponent
          </Link>
          <Link data-testid="link-to-maybe" to="/maybe">
            Maybe
          </Link>
          <Link data-testid="link-to-maybe-empty" to="/maybe-empty">
            Maybe Empty
          </Link>
          <Link data-testid="link-to-maybe-custom" to="/maybe-custom">
            Maybe Custom
          </Link>
          <Link
            data-testid="link-to-maybe-custom-component"
            to="/maybe-custom-component"
          >
            Maybe Custom Component
          </Link>
          <Link data-testid="link-to-auth" to="/auth">
            Auth
          </Link>
          <Link data-testid="link-to-auth-empty" to="/auth-empty">
            Auth Empty
          </Link>
          <Link data-testid="link-to-auth-custom" to="/auth-custom">
            Auth Custom
          </Link>
          <Link
            data-testid="link-to-auth-custom-component"
            to="/auth-custom-component"
          >
            Auth Custom
          </Link>
        </div>
      )

      function CustomSpinnyComponent() {
        return <div data-testid="spinner">CustomSpinnyComponent</div>
      }

      function MaybeCustomSpinner({ msg }: { msg?: string }) {
        return <div data-testid="spinner">MaybeCustomSpinner{msg}</div>
      }

      function MaybeCustomSpinner2() {
        return <MaybeCustomSpinner />
      }

      function AuthSpinner() {
        return <div data-testid="spinner">AuthSpinnerComponent</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <AuthRoutesProvider spinner={<SpinnyBoy />}>
            <MemoryRouter initialEntries={['/home']} initialIndex={0}>
              <NavBar />
              <Switch>
                <GuestRoute path={'/home'}>
                  <Home />
                </GuestRoute>
                <GuestRoute path={'/empty'} spinner={null}>
                  <Home />
                </GuestRoute>
                <GuestRoute
                  path="/custom"
                  spinner={<div data-testid={'spinner'}>CustomSpinny</div>}
                >
                  <Home />
                </GuestRoute>
                <GuestRoute
                  path="/custom-component"
                  spinnerComponent={CustomSpinnyComponent}
                >
                  <Home />
                </GuestRoute>
                <MaybeAuthRoute path="/maybe" component={Home} />
                <MaybeAuthRoute path="/maybe-empty" spinner={null}>
                  <Home />
                </MaybeAuthRoute>
                <MaybeAuthRoute
                  path="/maybe-custom"
                  spinner={<MaybeCustomSpinner msg="XD" />}
                >
                  <Home />
                </MaybeAuthRoute>
                <MaybeAuthRoute
                  path="/maybe-custom-component"
                  spinnerComponent={MaybeCustomSpinner2}
                >
                  <Home />
                </MaybeAuthRoute>
                <AuthRoute path={'/auth'}>
                  <Home />
                </AuthRoute>
                <AuthRoute path={'/auth-empty'} spinner={null}>
                  <Home />
                </AuthRoute>
                <AuthRoute
                  path={'/auth-custom'}
                  spinner={<div data-testid={'spinner'}>AuthSpinny</div>}
                >
                  <Home />
                </AuthRoute>
                <AuthRoute
                  path={'/auth-custom-component'}
                  spinnerComponent={AuthSpinner}
                >
                  <Home />
                </AuthRoute>
              </Switch>
            </MemoryRouter>
          </AuthRoutesProvider>
        </Auth>
      )

      const { getByTestId, queryAllByTestId } = render(<App />)

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-empty'))
      })

      // No spinner
      expect(queryAllByTestId('spinner').length).toBe(0)

      await act(async () => {
        fireEvent.click(getByTestId('link-to-custom'))
      })

      // Custom Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('CustomSpinny')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-custom-component'))
      })

      // Custom Spinner Component on the page
      expect(getByTestId('spinner').textContent).toEqual(
        'CustomSpinnyComponent'
      )

      await act(async () => {
        fireEvent.click(getByTestId('link-to-maybe'))
      })

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-maybe-empty'))
      })

      // No spinner
      expect(queryAllByTestId('spinner').length).toBe(0)

      await act(async () => {
        fireEvent.click(getByTestId('link-to-maybe-custom'))
      })

      // Custom Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('MaybeCustomSpinnerXD')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-maybe-custom-component'))
      })

      // Custom Spinner component on the page
      expect(getByTestId('spinner').textContent).toEqual('MaybeCustomSpinner')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-auth'))
      })

      // Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('Spinny')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-auth-empty'))
      })

      // No spinner
      expect(queryAllByTestId('spinner').length).toBe(0)

      await act(async () => {
        fireEvent.click(getByTestId('link-to-auth-custom'))
      })

      // Custom Spinner on the page
      expect(getByTestId('spinner').textContent).toEqual('AuthSpinny')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-auth-custom-component'))
      })

      // Custom Spinner component on the page
      expect(getByTestId('spinner').textContent).toEqual('AuthSpinnerComponent')
    })

    it('should configure auth redirects', async () => {
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

      const NavBar = () => (
        <div>
          <Link data-testid="link-to-custom-redirect" to="/custom-redirect">
            CustomRedirect
          </Link>
        </div>
      )

      function CustomAnon() {
        return <div data-testid="anon">CustomAnon</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <AuthRoutesProvider authRedirectTo="/anon">
            <MemoryRouter initialEntries={['/home']} initialIndex={0}>
              <NavBar />
              <Switch>
                <AuthRoute path="/home">
                  <Home />
                </AuthRoute>
                <AuthRoute path="/custom-redirect" redirectTo="/custom-anon">
                  <Home />
                </AuthRoute>
                <Route path="/anon">
                  <Anon />
                </Route>
                <GuestRoute path="/custom-anon">
                  <CustomAnon />
                </GuestRoute>
              </Switch>
            </MemoryRouter>
          </AuthRoutesProvider>
        </Auth>
      )

      const { getByTestId } = render(<App />)

      // Empty local storage
      await act(async () => {
        resolvesGetItem[0](null)
      })

      expect(getByTestId('anon').textContent).toEqual('Anon')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-custom-redirect'))
      })

      expect(getByTestId('anon').textContent).toEqual('CustomAnon')
    })

    it('should configure guest redirects', async () => {
      const loginCall = jest.fn()

      const meCall = jest
        .fn<Promise<DummyUser>, [number]>()
        .mockResolvedValue({ username: 'Gio Va' })

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

      const NavBar = () => (
        <div>
          <Link data-testid="link-to-guest" to="/guest">
            Guest
          </Link>
          <Link data-testid="link-to-custom-guest" to="/custom-guest">
            Custom Guest
          </Link>
        </div>
      )

      function WelcomeHome() {
        return <div data-testid="home">WelcomeHome</div>
      }

      function CustomHome() {
        return <div data-testid="home">CustomHome</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <AuthRoutesProvider guestRedirectTo="/welcome-home">
            <MemoryRouter initialEntries={['/home']} initialIndex={0}>
              <NavBar />
              <Switch>
                <AuthRoute path="/home">
                  <Home />
                </AuthRoute>
                <AuthRoute path="/welcome-home">
                  <WelcomeHome />
                </AuthRoute>
                <AuthRoute path="/custom-home">
                  <CustomHome />
                </AuthRoute>
                <GuestRoute path="/guest">
                  <Anon />
                </GuestRoute>
                <GuestRoute path="/custom-guest" redirectTo="/custom-home">
                  <Anon />
                </GuestRoute>
              </Switch>
            </MemoryRouter>
          </AuthRoutesProvider>
        </Auth>
      )

      const { getByTestId } = render(<App />)

      // Empty local storage
      await act(async () => {
        resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
      })

      expect(meCall).toHaveBeenCalled()

      // Show ma home
      expect(getByTestId('home').textContent).toEqual('Home')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-guest'))
      })

      // Show welcome home
      expect(getByTestId('home').textContent).toEqual('WelcomeHome')

      await act(async () => {
        fireEvent.click(getByTestId('link-to-custom-guest'))
      })

      expect(getByTestId('home').textContent).toEqual('CustomHome')
    })

    it('should configure redirect based un test function', async () => {
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
        return <div data-testid="home">Gengar</div>
      }

      const App = () => (
        <Auth loginCall={loginCall} meCall={meCall}>
          <AuthRoutesProvider
            authRedirectTest={(user) =>
              user.username === 'GenGar' ? '/gengar' : null
            }
          >
            <MemoryRouter initialEntries={['/home']} initialIndex={0}>
              <Switch>
                <Route path="/vulpix">
                  <div data-testid="home">Vulpix</div>
                </Route>
                <AuthRoute
                  redirectTest={(user) => '/vulpix'}
                  path="/custom-redirect"
                >
                  <Gengar />
                </AuthRoute>
                <AuthRoute redirectTest={null} path="/gengar">
                  <div>
                    <div data-testid='home'>Gengar</div>
                    <Link data-testid="to-vulpix" to="/custom-redirect">
                      2 Vulpix
                    </Link>
                  </div>
                </AuthRoute>
                <AuthRoute path={'/home'}>
                  <Home />
                </AuthRoute>
              </Switch>
            </MemoryRouter>
          </AuthRoutesProvider>
        </Auth>
      )

      const { getByTestId } = render(<App />)

      // Local storage
      await act(async () => {
        resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
      })

      // Me Call
      await act(async () => {
        resolveMe({ username: 'GenGar' })
      })

      expect(getByTestId('home').textContent).toEqual('Gengar')

      await act(async () => {
        fireEvent.click(getByTestId('to-vulpix'))
      })

      expect(getByTestId('home').textContent).toEqual('Vulpix')
    })
  })
})
