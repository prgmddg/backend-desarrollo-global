import { Request, Response, Router } from 'express'
import { RowDataPacket } from 'mysql2'
import connection from 'src/database/connection'

export const router = Router()

interface Programs extends RowDataPacket {
    _id: number
    name: string
    start: Date
    end: Date
}

interface TotalDB extends RowDataPacket {
    total: number
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query

    const limit = isNaN(Number(query.limit)) ? 10 : Number(query.limit)
    const offset = ((isNaN(Number(query.page)) ? 1 : Number(query.page)) - 1) * limit

    if (query.type === 'curso') {
      const [datos] = await connection.query<TotalDB[]>(`SELECT COUNT(*) as total FROM curso ${query.search ? `WHERE curso_id LIKE '%${query.search}' OR titulo LIKE '%${query.search}%'` : ''}`)
      const [programs] = await connection.query<Programs[]>(`SELECT curso_id as '_id', titulo as name, fecha_inicio as start, fecha_fin as end FROM curso ${query.search ? `WHERE curso_id LIKE '%${query.search}' OR titulo LIKE '%${query.search}%'` : ''} ORDER BY fecha_inicio DESC LIMIT ? OFFSET ?`, [limit, offset])

      return res.status(200).json({
        total: datos[0].total,
        programs
      })
    }

    if (query.type === 'diploma' || query.type === 'diplomado') {
      const [datos] = await connection.query<TotalDB[]>(`SELECT COUNT(*) as total FROM diplomado ${query.search ? `WHERE diplomado_id LIKE '%${query.search}' OR titulo LIKE '%${query.search}%'` : ''}`)
      const [programs] = await connection.query<Programs[]>(`SELECT diplomado_id as '_id', titulo as name, fecha_inicio as start FROM diplomado ${query.search ? `WHERE diplomado_id LIKE '%${query.search}' OR titulo LIKE '%${query.search}%'` : ''} ORDER BY fecha_inicio DESC LIMIT ? OFFSET ?`, [limit, offset])

      return res.status(200).json({
        total: datos[0].total,
        programs
      })
    }

    return res.status(200).json({
      total: 0,
      programs: []
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_ERROR' })
  }
})

export default router
