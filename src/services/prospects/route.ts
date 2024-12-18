import { Request, Response, Router } from 'express'
import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText } from '../../utils/format'

interface Prospects extends RowDataPacket{
  programId: number
  programName: string
  type: string
  totalProspects: number
}

interface Program extends RowDataPacket {
  id: number
  name: string
}

interface Prospect extends RowDataPacket{
  id: number
  names: string
  email: string
  mobile: string
  modality: string
  city: string
  page: string
  content: string
}

export const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end, type, cod, limit, page } = req.query as { start ?: string, end ?: string, type ?: 'AL' | 'CU' | 'IH' | 'DI' | 'DP', cod ?: string, limit?: string, page?: string }

    const l = !limit ? 10 : parseInt(limit)
    const o = !page ? 0 : (parseInt(page) - 1) * l

    let query = ''
    let filterDate = ''

    if (start && end) filterDate = `AND s.fecha_registro >= '${start}' AND s.fecha_registro <= '${end}'`
    if (!start && end) filterDate = `AND s.fecha_registro <= '${end}'`
    if (start && !end) filterDate = `AND s.fecha_registro >= '${start}'`

    if (!type || type === 'AL') {
      query = `
      SELECT
          ls.codigo_programa as programId,
          p.titulo as programName,
          COUNT(s.id_lista) as totalProspects,
          s.modalidad as type
      FROM lista_suscriptor ls
               INNER JOIN suscriptor s ON ls.id_lista = s.id_lista
               INNER JOIN curso p ON ls.codigo_programa = p.curso_id
      WHERE
          s.correo <> ''
          ${filterDate}
          ${cod ? `AND p.curso_id = ${cod}` : ''}
          AND (s.modalidad = 'curso' OR s.modalidad = 'inhouse' OR s.modalidad = 'In-House')
      GROUP BY ls.codigo_programa, p.titulo, s.modalidad
      UNION
      SELECT
          ls.codigo_programa as programId,
          p.titulo as programName,
          COUNT(s.id_lista) as cantidad,
          s.modalidad as type
      FROM lista_suscriptor ls
               INNER JOIN suscriptor s ON ls.id_lista = s.id_lista
               INNER JOIN diplomado p ON ls.codigo_programa = p.diplomado_id
      WHERE
          s.correo <> ''
          ${filterDate}
          ${cod ? `AND p.diplomado_id = ${cod}` : ''}
          AND (s.modalidad = 'diploma' OR s.modalidad = 'diplomado')
      GROUP BY ls.codigo_programa, p.titulo, s.modalidad
      LIMIT ${l} OFFSET ${o}
    `
    }

    if (type === 'CU') {
      query = `
          SELECT
              ls.codigo_programa as programId,
              p.titulo as programName,
              COUNT(s.id_lista) as totalProspects,
              s.modalidad as type
          FROM lista_suscriptor ls
                   INNER JOIN suscriptor s ON ls.id_lista = s.id_lista
                   INNER JOIN curso p ON ls.codigo_programa = p.curso_id
          WHERE
              s.correo <> ''
                  ${filterDate}
                  ${cod ? `AND p.curso_id = ${cod}` : ''}
            AND s.modalidad = 'curso'
          GROUP BY ls.codigo_programa, p.titulo, s.modalidad
          ORDER BY COUNT(s.id_lista) DESC
          LIMIT ${l} OFFSET ${o}
      `
    }

    if (type === 'IH') {
      query = `
          SELECT
              ls.codigo_programa as programId,
              p.titulo as programName,
              COUNT(s.id_lista) as totalProspects,
              s.modalidad as type
          FROM lista_suscriptor ls
                   INNER JOIN suscriptor s ON ls.id_lista = s.id_lista
                   INNER JOIN curso p ON ls.codigo_programa = p.curso_id
          WHERE
              s.correo <> ''
                  ${filterDate}
                  ${cod ? `AND p.curso_id = ${cod}` : ''}
            AND (s.modalidad = 'inhouse' OR s.modalidad = 'In-House')
          GROUP BY ls.codigo_programa, p.titulo, s.modalidad
          ORDER BY COUNT(s.id_lista) DESC
          LIMIT ${l} OFFSET ${o}
    `
    }

    if (type === 'DI') {
      query = `
          SELECT
              ls.codigo_programa as programId,
              p.titulo as programName,
              COUNT(s.id_lista) as totalProspects,
              s.modalidad as type
          FROM lista_suscriptor ls
                   INNER JOIN suscriptor s ON ls.id_lista = s.id_lista
                   INNER JOIN diplomado p ON ls.codigo_programa = p.diplomado_id
          WHERE
              s.correo <> ''
                  ${filterDate}
                  ${cod ? `AND p.diplomado_id = ${cod}` : ''}
            AND s.modalidad = 'diploma'
          GROUP BY ls.codigo_programa, p.titulo, s.modalidad
          ORDER BY COUNT(s.id_lista) DESC
          LIMIT ${l} OFFSET ${o}
      `
    }

    if (type === 'DP') {
      query = `
          SELECT
              ls.codigo_programa as programId,
              p.titulo as programName,
              COUNT(s.id_lista) as totalProspects,
              s.modalidad as type
          FROM lista_suscriptor ls
                   INNER JOIN suscriptor s ON ls.id_lista = s.id_lista
                   INNER JOIN diplomado p ON ls.codigo_programa = p.diplomado_id
          WHERE s.correo <> ''
              ${filterDate}
              ${cod ? `AND p.diplomado_id = ${cod}` : ''}
            AND s.modalidad = 'diplomado'
          GROUP BY ls.codigo_programa, p.titulo, s.modalidad
          ORDER BY COUNT(s.id_lista) DESC
          LIMIT ${l} OFFSET ${o}
      `
    }

    const [prospects] = await connection.query<Prospects[]>(query)

    if (prospects.length === 0) return res.status(200).json({ total: 0, prospects })

    return res.status(200).json({
      total: prospects.length,
      prospects: prospects.map((prospect) => (
        {
          ...prospect,
          programName: formatText(prospect.programName, 'lower')
        }
      ))
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'INTERNAL_SERVER_ERROR' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const { start, end, type, limit, page } = req.query as { start ?: string, end ?: string, type : 'curso' | 'in-house' | 'diploma' | 'diplomado', limit?: string, page?: string }

    let query = ''

    if (type === 'diploma' || type === 'diplomado') {
      query = 'SELECT diplomado_id as id, titulo as name FROM diplomado WHERE diplomado_id = ?'
    }

    if (type === 'curso' || type === 'in-house') {
      query = 'SELECT curso_id as id, titulo as name FROM curso WHERE curso_id = ?'
    }

    const [programs] = await connection.query<Program[]>(query, [id])

    if (programs.length === 0) return res.status(404).json({ message: 'NOT_FOUND' })

    const l = !limit ? 10 : parseInt(limit)
    const o = !page ? 0 : (parseInt(page) - 1) * l

    let filterDate = ''

    if (start && end) filterDate = `AND s.fecha_registro >= '${start}' AND s.fecha_registro <= '${end}'`
    if (!start && end) filterDate = `AND s.fecha_registro <= '${end}'`
    if (start && !end) filterDate = `AND s.fecha_registro >= '${start}'`

    if (type === 'curso') {
      query = `
          SELECT
              s.id_prospecto as id,
              s.correo as email,
              s.nombres as names,
              s.telefono as mobile,
              s.modalidad as modality,
              s.ciudad as city,
              s.pagina as page,
              s.contenido as content
          FROM suscriptor s
                   INNER JOIN lista_suscriptor ls ON ls.id_lista = s.id_lista
          WHERE
              s.correo <> ''
              AND ls.codigo_programa = ?
              ${filterDate}
              AND s.modalidad = 'curso'
          LIMIT ${l} OFFSET ${o}
      `
    }

    if (type === 'in-house') {
      query = `
          SELECT
              s.id_prospecto as id,
              s.correo as email,
              s.nombres as names,
              s.telefono as mobile,
              s.modalidad as modality,
              s.ciudad as city,
              s.pagina as page,
              s.contenido as content
          FROM suscriptor s
                   INNER JOIN lista_suscriptor ls ON ls.id_lista = s.id_lista
          WHERE
              s.correo <> ''
            AND ls.codigo_programa = ?
              ${filterDate}
              AND (s.modalidad = 'inhouse' OR s.modalidad = 'In-House')
          LIMIT ${l} OFFSET ${o}
    `
    }

    if (type === 'diploma') {
      query = `
          SELECT
              s.id_prospecto as id,
              s.correo as email,
              s.nombres as names,
              s.telefono as mobile,
              s.modalidad as modality,
              s.ciudad as city,
              s.pagina as page,
              s.contenido as content
          FROM suscriptor s
                   INNER JOIN lista_suscriptor ls ON ls.id_lista = s.id_lista
          WHERE
              s.correo <> ''
            AND ls.codigo_programa = ?
              ${filterDate}
              AND s.modalidad = 'diploma'
          LIMIT ${l} OFFSET ${o}
      `
    }

    if (type === 'diplomado') {
      query = `
          SELECT
              s.id_prospecto as id,
              s.correo as email,
              s.nombres as names,
              s.telefono as mobile,
              s.modalidad as modality,
              s.ciudad as city,
              s.pagina as page,
              s.contenido as content
          FROM suscriptor s
                   INNER JOIN lista_suscriptor ls ON ls.id_lista = s.id_lista
          WHERE
              s.correo <> ''
            AND ls.codigo_programa = ?
              ${filterDate}
              AND s.modalidad = 'diplomado'
          LIMIT ${l} OFFSET ${o}
      `
    }

    const [prospects] = await connection.query<Prospect[]>(query, [id])

    if (prospects.length === 0) {
      return res.status(200).json({
        total: 0,
        program: {
          id: programs[0].id,
          name: programs[0].name
        },
        prospects
      })
    }

    return res.status(200).json({
      total: prospects.length,
      program: {
        id: programs[0].id,
        name: formatText(programs[0].name, 'lower')
      },
      prospects: prospects.map(prospect => ({
        ...prospect,
        names: formatText(prospect.names, 'lower'),
        city: formatText(prospect.city, 'lower'),
        content: formatText(prospect.content, 'lower')
      }))
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'INTERNAL_SERVER_ERROR' })
  }
})

export default router
