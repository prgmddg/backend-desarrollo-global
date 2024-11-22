import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText } from '../../utils/format'

const blackListDisabledDownloads = [1945, 1946, 1947]

interface Courses extends RowDataPacket {
  id: number,
  name: string,
  endDate: string
}

interface AccessExams extends RowDataPacket {
  id: number | null,
  userId: number
}

export async function getCoursesEnd ({ days }: { days: number }) {
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

    return courses
  } catch (error) {
    console.log(error)
    return []
  }
}

export async function disabledDownloads ({ days }: { days: number }) {
  try {
    const courses = await getCoursesEnd({ days })
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

export async function disabledExams ({ days }: { days: number }) {
  try {
    const courses = await getCoursesEnd({ days })

    if (courses.length === 0) return true

    for (const course of courses) {
      const creates: string[] = []
      const updates: number[] = []

      const [accessExams] = await connection.query<AccessExams[]>(`
        SELECT
            ae.acceso_id as id,
            u.usuario_id as userId
        FROM curso_alumno_detalle ad
            INNER JOIN usuario u ON ad.alumno_id = u.usuario_id AND ad.curso_id = ?
            LEFT JOIN acceso_examen_usuario_curso ae ON ad.alumno_id = ae.usuario_id AND ae.curso_id = ?
      `, [course.id, course.id])

      if (accessExams.length === 0) continue

      for (const access of accessExams) {
        if (!access.id) { creates.push(`(${course.id}, ${access.userId}, 'b', '0000-00-00')`) } else { updates.push(access.id) }
      }

      if (creates.length > 0) {
        await connection.query(`
            INSERT INTO acceso_examen_usuario_curso (curso_id, usuario_id, estado, fecha_limite)
            VALUES ${creates.join(',')}
        `)
      }

      if (updates.length > 0) {
        await connection.query(`
            UPDATE acceso_examen_usuario_curso
            SET estado = 'b', fecha_limite = '0000-00-00'
            WHERE acceso_id IN (${updates.join(',')}) AND fecha_limite < CURDATE()
        `)
      }

      const message = `Se han deshabilitado ${accessExams.length} accesos ( creados: ${creates.length}, actualizados: ${updates.length} ) a los exámenes del programa (${course.id}) - ${formatText(course.name, 'upper')}`

      try {
        await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [true, message, 4])
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
