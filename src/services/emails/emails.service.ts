import { SendEmailCommand } from '@aws-sdk/client-ses'
import emailsClient from './emails.client'
import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText, splitIntoGroups } from '../../utils/format'
import getTemplateSessionReminder from './templates/getTemplateSessionReminder'

interface Courses extends RowDataPacket{
  url: string,
  id: number,
  sessionName: string,
  startSession: string,
  dateSession: string,
  programName: string,
  teacherName: string
}

interface Email extends RowDataPacket {
  name: string
}

const blacklistPrograms = [0, 52, 559, 500, 1215, 1657]
const blacklistUsers = [36296]

export async function sendEmail ({ from, to, subject, html }: { from: string, to: string[], subject: string, html: string }) {
  try {
    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: to
      },
      Message: {
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html
          }
        }
      }
    })

    const response = await emailsClient.send(command)

    return {
      status: response.$metadata.httpStatusCode === 200,
      message: response.$metadata.requestId
    }
  } catch (error) {
    return {
      status: false,
      message: String(error)
    }
  }
}

export async function getEmailsList ({ typeTime }: { typeTime: 'N' | 'T' }) {
  try {
    const typesTime: { [key:string]: string } = {
      N: 'CURDATE()',
      T: 'CURDATE() + INTERVAL 1 DAY'
    }

    const listCoursesEmails: {
      url: string,
      id: number,
      sessionName: string,
      startSession: string,
      dateSession: string,
      programName: string,
      teacherName: string,
      emails: string[][]
    }[] = []

    const [courses] = await connection.query<Courses[]>(`
      SELECT
          sc.video_descarga as url,
          sc.curso_id as id,
          sc.titulo as sessionName,
          sc.hora as startSession,
          CONCAT(YEAR(sc.fecha), '-', MONTH(sc.fecha), '-', DAY(sc.fecha)) as dateSession,
          c.titulo as programName,
          CONCAT(p.nombres, ' ', p.apellidos) as teacherName
      FROM sesion_curso as sc 
          LEFT JOIN curso as c ON sc.curso_id = c.curso_id
          INNER JOIN usuario as p ON sc.profesor_id = p.usuario_id
      WHERE sc.fecha = ${typesTime[typeTime]}
        AND sc.hora > '00:00:00'
        AND sc.hora > CURTIME()
        AND sc.titulo NOT LIKE '%DEMO%'
        AND sc.titulo NOT LIKE '%INSTALACIÓN%'
        AND sc.curso_id NOT IN (${blacklistPrograms.join(',')})
        AND sc.asistencia = 'S'
    `)

    if (courses.length === 0) return listCoursesEmails

    for (const course of courses) {
      const [emails] = await connection.query<Email[]>(`
        SELECT u.correo
        FROM curso_alumno_detalle cd
            INNER JOIN usuario u ON cd.alumno_id = u.usuario_id
        WHERE curso_id = ?
          AND u.usuario_id NOT IN (${blacklistUsers.join(',')})
      `, [course.id])

      if (emails.length === 0) continue

      listCoursesEmails.push({
        ...course,
        sessionName: formatText(course.sessionName),
        programName: formatText(course.programName),
        teacherName: formatText(course.teacherName),
        emails: splitIntoGroups(emails.map((email) => email.name), 25)
      })
    }

    return listCoursesEmails
  } catch (error) {
    console.log(error)
    return []
  }
}
export async function sendEmailSessionReminder ({ typeTime }: { typeTime: 'N' | 'T' }) {
  try {
    const FROM_EMAIL = 'no_reply@desarrolloglobal.pe'

    const listCoursesEmails = await getEmailsList({ typeTime })

    for (const course of listCoursesEmails) {
      const template = getTemplateSessionReminder({ ...course, typeTime })

      for (const emails of course.emails) {
        const response = await sendEmail({
          from: FROM_EMAIL,
          to: emails,
          subject: 'Recordatorio de Sesión',
          html: template
        })

        const message = response.status ? `${emails.length} correos enviados correctamente del programa (${course.id})-${course.programName} session ${course.sessionName}` : `Error: ${response.message}`

        try {
          await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [response.status, message, 1])
        } catch (error) {
          console.log(error)
        }
      }
    }

    return true
  } catch (error) {
    console.log(error)
    return false
  }
}
