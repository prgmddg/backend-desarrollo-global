import connection from '../../database/connection'
import { Request, Response, Router } from 'express'
import { compare } from '../../utils/bcrypt'
import { generateToken, verifyToken } from '../../utils/jwt'
import { RowDataPacket } from 'mysql2'

const categories: { [key: string]: string } = {
  ADMI: 'Administrador',
  ASES: 'Asesora',
  ALUM: 'Alumno'
}

interface UserDB extends RowDataPacket {
  usuario_id: number
  nombres: string
  apellidos: string
  correo: string
  password: string
  categoria: string
  avatar: string
  fecha_registro: string
  estado: string
}

export const router = Router()

router.post('/sign-in', async (req: Request, res: Response) => {
  try {
    const payload = req.body as { email: string, password: string, rememberMe: boolean }

    if (!payload.email) return res.status(400).json({ error: 'EMPTY_EMAIL' })
    if (!payload.password) return res.status(400).json({ error: 'EMPTY_PASSWORD' })
    const [users] = await connection.query<UserDB[]>('SELECT * FROM usuario WHERE categoria <> ? AND estado = ? AND correo = ? LIMIT 1', ['ALUM', 'A', payload.email])

    if (users.length === 0 || !(await compare(payload.password, users[0].password))) return res.status(401).json({ error: 'INVALID_USER' })

    const token = generateToken<{ email: string, rol: string }>({ email: users[0].correo, rol: users[0].categoria }, '7d')
    const expires = new Date()
    expires.setDate(expires.getDate() + (payload.rememberMe ? 7 : 1))
    expires.setHours(0, 0, 0, 0)

    return res.status(200).cookie('_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'development' ? undefined : '.desarrolloglobal.pe',
      expires
    }).json({
      _id: users[0].usuario_id,
      names: users[0].nombres,
      surnames: users[0].apellidos,
      email: users[0].correo,
      rol: {
        cod: users[0].categoria,
        name: categories[users[0].categoria]
      },
      picture: users[0].avatar,
      createdAt: users[0].fecha_registro,
      isActive: users[0].estado === 'A'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_SERVER' })
  }
})

router.get('/sign-out', async (req: Request, res: Response) => {
  try {
    return res.status(200).cookie('_session_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'development' ? undefined : '.desarrolloglobal.pe',
      expires: new Date(1)
    }).json({ message: 'LOGOUT' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_SERVER' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  try {
    const cookie = req.headers.cookie

    if (!cookie) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const tokenList = cookie.split(';').filter((c) => c.includes('_session_token='))
    if (tokenList.length === 0) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const token = tokenList[0].split('=').at(-1)
    if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const data = verifyToken<{ email: string, rol: string }>(token)

    if (!data) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const [users] = await connection.query<UserDB[]>('SELECT * FROM usuario WHERE categoria <> ? AND estado = ? AND correo = ? LIMIT 1', ['ALUM', 'A', data.email])

    if (users.length < 1) return res.status(401).json({ error: 'UNAUTHORIZED' })

    return res.status(200).json({
      _id: users[0].usuario_id,
      names: users[0].nombres,
      surnames: users[0].apellidos,
      email: users[0].correo,
      rol: {
        cod: users[0].categoria,
        name: categories[users[0].categoria]
      },
      picture: users[0].avatar,
      createdAt: users[0].fecha_registro,
      isActive: users[0].estado === 'A'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_SERVER' })
  }
})

export default router
