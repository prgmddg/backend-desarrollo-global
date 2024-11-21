import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText } from '../../utils/format'

const blackListDisabledDownloads = [1945, 1946, 1947]

interface Courses extends RowDataPacket {
  id: number,
  name: string,
  endDate: string
}

export default async function disabledDownloads ({ days }: { days: number }) {
  try {
    const [courses] = await connection.query<Courses[]>(`
    SELECT
        c.curso_id as id,
        c.titulo as name,
        c.fecha_fin as endDate
    FROM curso as c
    WHERE c.fecha_fin = CURDATE() - INTERVAL ${days} DAY
    ${blackListDisabledDownloads.length > 0 ? `AND c.curso_id NOT IN (${blackListDisabledDownloads.join(',')})` : ''}
  `)

    if (courses.length === 0) return true

    for (const course of courses) {
      const [result] = await connection.query(`
          DELETE dv
          FROM descarga_video dv
          INNER JOIN sesion_curso sc ON dv.sesion_id = sc.sesion_id
          INNER JOIN curso c ON sc.curso_id = c.curso_id
          WHERE c.curso_id = ?

     `, [course.id])

      const response = result as { affectedRows: number }

      const message = `Se han deshabilitado ${response.affectedRows} las descargas del programa (${course.id}) - ${formatText(course.name, 'upper')}`

      try {
        await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [true, message, 3])
      } catch (error) {
        console.log(error)
      }
    }

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
