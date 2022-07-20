
export function isUnauthorizedError(error: any) {
  return error?.status === 401 || error?.response?.status === 401
}