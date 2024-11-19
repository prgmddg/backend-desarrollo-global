import { Request, Response, Router } from 'express'
import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText } from '../../utils/format'

interface CertificatesDB extends RowDataPacket {
  certificado_id: number,
  programa: string,
  programa_id: number,
  usuario_id: number,
  url_descarga: string,
  fecha_registro: string,
  nombres: string,
  apellidos: string
}

interface TotalDB extends RowDataPacket {
  total: number
}

export const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = req.query

    const limit = isNaN(Number(query.limit)) ? 10 : Number(query.limit)
    const offset = ((isNaN(Number(query.page)) ? 1 : Number(query.page)) - 1) * limit

    const [data] = await connection.query<TotalDB[]>(`SELECT COUNT(*) as total FROM certificado_programa_alumno ca INNER JOIN usuario u ON ca.usuario_id = u.usuario_id ${query.search ? `WHERE CONCAT(u.nombres, ' ', u.apellidos) LIKE '%${query.search}%' OR u.dni LIKE '%${query.search}%'` : ''}`)
    const [certificates] = await connection.query<CertificatesDB[]>({
      sql: `SELECT ca.*, u.nombres as nombres, u.apellidos as apellidos FROM certificado_programa_alumno ca INNER JOIN usuario u ON ca.usuario_id = u.usuario_id ${query.search ? `WHERE CONCAT(u.nombres, ' ', u.apellidos) LIKE '%${query.search}%' OR u.dni LIKE '%${query.search}%'` : ''} ORDER BY ca.fecha_registro DESC LIMIT ? OFFSET ?`
    }, [limit, offset])

    return res.status(200).json({
      total: data[0].total,
      certificates: certificates.map((certificate) => {
        const cod = Number(certificate.url_descarga.split('-').at(-1)?.split('.')[0])

        const createdAt = new Date(certificate.fecha_registro)
        createdAt.setHours(createdAt.getHours() + 5)

        return {
          _id: certificate.certificado_id,
          cod: isNaN(cod) ? 0 : cod,
          type: certificate.programa.toLowerCase(),
          program: certificate.programa_id,
          url: certificate.url_descarga,
          user: {
            names: formatText(certificate.nombres),
            surnames: formatText(certificate.apellidos)
          },
          createdAt: certificate.fecha_registro
        }
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_ERROR' })
  }
})

export default router
