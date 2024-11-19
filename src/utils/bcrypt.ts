import * as bcrypt from 'bcrypt'

export async function encode (password: string): Promise<string> {
  const SALT = await bcrypt.genSalt()

  return bcrypt.hash(password, SALT)
}

export function compare (password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
