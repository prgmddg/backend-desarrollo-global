import * as jwt from 'jsonwebtoken'

export function generateToken<T> (payload: T, expiresIn: string) {
  return jwt.sign(payload as object, process.env.JWT_SECRET ?? '', {
    expiresIn
  })
}

export function verifyToken<T> (token: string): T | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET ?? '') as T
  } catch {
    return null
  }
}
