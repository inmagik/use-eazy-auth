import {
  useContext,
  useState,
  useCallback,
  useMemo,
  ChangeEvent,
  FormEvent,
} from 'react'
import {
  AuthUserContext,
  AuthStateContext,
  AuthActionsContext,
  AuthActionCreators,
  AuthUser,
} from './Auth'

export function useAuthState() {
  const authState = useContext(AuthStateContext)
  return authState
}

export function useAuthActions<A = any, R = any, U = any, C = any>() {
  const actions = useContext<AuthActionCreators<A, R, U, C>>(AuthActionsContext)
  return actions
}

export function useAuthUser<U = any, A = any>() {
  const user = useContext<AuthUser<U, A>>(AuthUserContext)
  return user
}

interface ValueProp {
  value: string
}

interface OnChangeProp {
  onChange(e: ChangeEvent<HTMLInputElement>): void
}

export interface ShapeLoginResult {
  handleSubmit(e: FormEvent): void
  login(): void
  loginError: any
  loginLoading: boolean
}

export type LoginResult = ShapeLoginResult &
  Record<string, ValueProp & OnChangeProp>

// TODO: On the very end this hook sucks and realted types sucks
// in future we must rewrite it or find a more suitable solution
// here for compatibility reasons
export function useLogin(
  credentialsConf: string[] = ['username', 'password']
): LoginResult {
  const [credentials, setCredentials] = useState<Record<string, string>>({})

  const { loginError, loginLoading } = useAuthState()

  const { login } = useAuthActions()

  const loginWithCredentials = useCallback(() => {
    login(credentials)
  }, [login, credentials])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      loginWithCredentials()
    },
    [loginWithCredentials]
  )

  const valuesProps: Record<string, ValueProp> = useMemo(() => {
    return credentialsConf.reduce(
      (out, name) => ({
        ...out,
        [name]: {
          value: credentials[name] === undefined ? '' : credentials[name],
        },
      }),
      {}
    )
  }, [credentials, credentialsConf])

  const onChangesProps: Record<string, OnChangeProp> = useMemo(() => {
    return credentialsConf.reduce(
      (out, name) => ({
        ...out,
        [name]: {
          onChange: (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value
            setCredentials((credentials) => ({
              ...credentials,
              [name]: value,
            }))
          },
        },
      }),
      {}
    )
  }, [setCredentials, credentialsConf])

  const credentialsProps: Record<
    string,
    ValueProp & OnChangeProp
  > = useMemo(() => {
    return Object.keys(valuesProps).reduce(
      (r, name) => ({
        ...r,
        [name]: {
          ...valuesProps[name],
          ...onChangesProps[name],
        },
      }),
      {}
    )
  }, [valuesProps, onChangesProps])

  return {
    handleSubmit,
    login: loginWithCredentials,
    loginError,
    loginLoading,
    ...credentialsProps,
  } as LoginResult
}