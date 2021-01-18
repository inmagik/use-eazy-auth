import React from 'react'
import { renderHook, act } from '@testing-library/react-hooks'
import { ReactNode } from 'react'
import Auth, { useAuthActions, useAuthUser, useAuthState } from '../index'
import { InitialAuthData } from '../types'

interface TestCallBack<V = any> {
  (value: V): void
}

interface DummyUser {
  username: string
}

describe('Auth', () => {
  it('should be aware of calls failure', async () => {
    const loginCall = jest.fn().mockRejectedValueOnce('GioVa')
    const meCall = jest.fn().mockRejectedValue('GioVa')

    // Fake an empty local storage
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

    const AuthWrapper = ({ children }: { children: ReactNode }) => (
      <Auth loginCall={loginCall} meCall={meCall}>
        {children}
      </Auth>
    )

    const { result } = renderHook(() => useAuthActions(), {
      wrapper: AuthWrapper,
    })

    await act(async () => {
      resolvesGetItem[0](null)
    })

    await act(async () => {
      result.current.login({})
    })
    expect(loginCall).toHaveBeenCalledTimes(1)
    expect(meCall).toHaveBeenCalledTimes(0)

    loginCall.mockRejectedValueOnce('Fuck')
    await act(async () => {
      result.current.login({})
    })
    expect(loginCall).toHaveBeenCalledTimes(2)
    expect(meCall).toHaveBeenCalledTimes(0)

    loginCall.mockResolvedValueOnce('Yeaah')
    await act(async () => {
      result.current.login({})
    })
    expect(loginCall).toHaveBeenCalledTimes(3)
    expect(meCall).toHaveBeenCalledTimes(1)

    loginCall.mockResolvedValueOnce('Yeaah')
    await act(async () => {
      result.current.login({})
    })
    expect(loginCall).toHaveBeenCalledTimes(4)
    expect(meCall).toHaveBeenCalledTimes(2)
  })

  it('Should give an action to imperative setTokens', async () => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe: TestCallBack<DummyUser>
    const meCall = jest.fn(
      () =>
        new Promise<DummyUser>((resolve) => {
          resolveMe = resolve
        })
    )

    // Fake a good storage
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

    const AuthWrapper = ({ children }: { children: ReactNode }) => (
      <Auth loginCall={loginCall} meCall={meCall}>
        {children}
      </Auth>
    )

    function useAllAuth() {
      return { user: useAuthUser(), actions: useAuthActions() }
    }

    const { result } = renderHook(() => useAllAuth(), {
      wrapper: AuthWrapper,
    })

    await act(async () => {
      resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
    })

    await act(async () => {
      resolveMe({ username: 'Giova' })
    })

    expect(result.current.user).toEqual({
      user: { username: 'Giova' },
      token: 23,
    })

    await act(async () => {
      result.current.actions.setTokens({ accessToken: 99 })
    })

    // Token in ma state
    expect(result.current.user).toEqual({
      user: { username: 'Giova' },
      token: 99,
    })

    // TOken in storage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auth',
      JSON.stringify({
        accessToken: 99,
      })
    )

    const fakeApi = jest.fn((t) => () => Promise.resolve(88))

    await act(async () => {
      await result.current.actions.callAuthApiPromise(fakeApi)
    })

    // Token for ma caller
    expect(fakeApi).toHaveBeenCalledWith(99)
  })

  it('Should give an action to updateUser', async () => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe: TestCallBack<DummyUser>
    const meCall = jest.fn(
      () =>
        new Promise<DummyUser>((resolve) => {
          resolveMe = resolve
        })
    )

    // Fake a good storage
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

    const AuthWrapper = ({ children }: { children: ReactNode }) => (
      <Auth loginCall={loginCall} meCall={meCall}>
        {children}
      </Auth>
    )

    function useAllAuth() {
      return {
        user: useAuthUser<DummyUser, number>(),
        actions: useAuthActions<number, never, DummyUser>(),
      }
    }

    const { result } = renderHook(() => useAllAuth(), {
      wrapper: AuthWrapper,
    })

    await act(async () => {
      resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
    })

    await act(async () => {
      resolveMe({ username: 'Giova' })
    })

    expect(result.current.user).toEqual({
      user: { username: 'Giova' },
      token: 23,
    })

    await act(async () => {
      result.current.actions.updateUser({ username: 'Boundman!' })
    })

    expect(result.current.user).toEqual({
      user: { username: 'Boundman!' },
      token: 23,
    })
  })

  it('Should give an action to updateUser ... as a functional updater', async () => {
    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe: TestCallBack<DummyUser>
    const meCall = jest.fn(
      () =>
        new Promise<DummyUser>((resolve) => {
          resolveMe = resolve
        })
    )

    // Fake a good storage
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

    const AuthWrapper = ({ children }: { children: ReactNode }) => (
      <Auth loginCall={loginCall} meCall={meCall}>
        {children}
      </Auth>
    )

    function useAllAuth() {
      return {
        user: useAuthUser<DummyUser, number>(),
        actions: useAuthActions<number, never, DummyUser>(),
      }
    }

    const { result } = renderHook(() => useAllAuth(), {
      wrapper: AuthWrapper,
    })

    await act(async () => {
      resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
    })

    await act(async () => {
      resolveMe({ username: 'Giova' })
    })

    expect(result.current.user).toEqual({
      user: { username: 'Giova' },
      token: 23,
    })

    await act(async () => {
      result.current.actions.updateUser((user) => ({
        username: user?.username + ' <.<',
      }))
    })

    expect(result.current.user).toEqual({
      user: { username: 'Giova <.<' },
      token: 23,
    })
  })

  it('Should give an action to patchUser', async () => {
    interface AgedUser {
      username: string
      age: number
    }

    // Fake da calls
    const loginCall = jest.fn()
    // Hack for manual resolve the me promise
    let resolveMe: TestCallBack<AgedUser>
    const meCall = jest.fn(
      () =>
        new Promise<AgedUser>((resolve) => {
          resolveMe = resolve
        })
    )

    // Fake a good storage
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

    const AuthWrapper = ({ children }: { children: ReactNode }) => (
      <Auth loginCall={loginCall} meCall={meCall}>
        {children}
      </Auth>
    )

    function useAllAuth() {
      return {
        user: useAuthUser<AgedUser, number>(),
        actions: useAuthActions<number, never, AgedUser>(),
      }
    }

    const { result } = renderHook(() => useAllAuth(), {
      wrapper: AuthWrapper,
    })

    await act(async () => {
      resolvesGetItem[0](JSON.stringify({ accessToken: 23 }))
    })

    await act(async () => {
      resolveMe({ username: 'Giova', age: 23 })
    })

    expect(result.current.user).toEqual({
      user: { username: 'Giova', age: 23 },
      token: 23,
    })

    await act(async () => {
      result.current.actions.patchUser({ age: 99 })
    })

    expect(result.current.user).toEqual({
      user: { username: 'Giova', age: 99 },
      token: 23,
    })
  })

  it('should init unauthenticated state using initialData prop', async () => {
    const loginCall = jest.fn()
    const meCall = jest.fn()

    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const AuthWrapper = ({
      children,
      initialData,
    }: {
      children?: ReactNode
      initialData: InitialAuthData
    }) => (
      <Auth loginCall={loginCall} meCall={meCall} initialData={initialData}>
        {children}
      </Auth>
    )

    function useAllAuth() {
      return {
        actions: useAuthActions(),
        user: useAuthUser(),
        state: useAuthState(),
      }
    }

    const { result } = renderHook(() => useAllAuth(), {
      wrapper: AuthWrapper,
      initialProps: {
        initialData: {
          user: null,
          accessToken: null,
        },
      },
    })

    expect(window.localStorage.getItem).not.toHaveBeenCalled()
    expect(window.localStorage.setItem).not.toHaveBeenCalled()
    expect(meCall).not.toHaveBeenCalled()

    expect(result.current.user).toEqual({
      token: null,
      user: null,
    })
    expect(result.current.state).toEqual({
      bootstrappedAuth: true,
      authenticated: false,
      loginLoading: false,
      loginError: null,
    })

    const fakeApi = jest.fn((t) => () => Promise.resolve(88))

    await act(async () => {
      await result.current.actions.callAuthApiPromise(fakeApi)
    })

    // null token 4 ma caller
    expect(fakeApi).toHaveBeenCalledWith(null)
  })

  it('should init authenticated state using initialData prop', async () => {
    const loginCall = jest.fn()
    const meCall = jest.fn()

    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(global, '_localStorage', {
      value: localStorageMock,
      writable: true,
    })

    const AuthWrapper = ({
      children,
      initialData,
    }: {
      children?: ReactNode
      initialData: InitialAuthData
    }) => (
      <Auth loginCall={loginCall} meCall={meCall} initialData={initialData}>
        {children}
      </Auth>
    )

    function useAllAuth() {
      return {
        actions: useAuthActions(),
        user: useAuthUser(),
        state: useAuthState(),
      }
    }

    const { result } = renderHook(() => useAllAuth(), {
      wrapper: AuthWrapper,
      initialProps: {
        initialData: {
          user: {
            id: 23,
            username: '@giova',
            name: 'Giova',
          },
          accessToken: 'z3cr3t',
        },
      },
    })

    expect(window.localStorage.getItem).not.toHaveBeenCalled()
    expect(window.localStorage.setItem).not.toHaveBeenCalled()
    expect(meCall).not.toHaveBeenCalled()

    expect(result.current.user).toEqual({
      token: 'z3cr3t',
      user: {
        id: 23,
        username: '@giova',
        name: 'Giova',
      },
    })
    expect(result.current.state).toEqual({
      bootstrappedAuth: true,
      authenticated: true,
      loginLoading: false,
      loginError: null,
    })

    const fakeApi = jest.fn((t) => () => Promise.resolve(88))

    await act(async () => {
      await result.current.actions.callAuthApiPromise(fakeApi)
    })

    // null token 4 ma caller
    expect(fakeApi).toHaveBeenCalledWith('z3cr3t')
  })
})
