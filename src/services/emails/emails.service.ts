import { SendEmailCommand } from '@aws-sdk/client-ses'
import emailsClient from './emails.client'
import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText, splitIntoGroups } from '../../utils/format'
import getTemplateSessionReminder from './templates/getTemplateSessionReminder'
import getTemplateInstallmentDueReminder from './templates/getTemplateInstallmentDueReminder'

interface Courses extends RowDataPacket{
  url: string,
  id: number,
  sessionName: string,
  startSession: string,
  dateSession: string,
  programName: string,
  teacherName: string
}

interface Installments extends RowDataPacket {
  id: number,
  studentName: string,
  studentSurname: string,
  email: string,
  programName: string,
  cod: string,
  amount: number,
  advisors: string
}

interface Advisor extends RowDataPacket {
    mobile: string,
    phone: string
}

interface Email extends RowDataPacket {
  name: string
}

const blacklistPrograms: number[] = [0, 2236, 52, 559, 500, 1215, 1657, 1862]
const customPrograms: number[] = []
const blacklistUsers: number[] = [36296]

const SUPPORTS_NUMBER = ['990945941', '952379602']
const FROM_EMAIL = 'no_reply@desarrolloglobal.pe'

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

export async function getEmailsSessionReminderList ({ typeTime, programId }: { typeTime: 'N' | 'T' | 'C', programId?: number }) {
  try {
    const typesTime: { [key:string]: string } = {
      N: 'CURDATE() AND sc.hora > CURTIME()',
      C: 'CURDATE() AND sc.hora >= CURTIME() + INTERVAL 1 HOUR AND sc.hora < CURTIME() + INTERVAL 2 HOUR',
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
        ${programId ? `AND c.curso_id = ${programId}` : ''}
        AND sc.hora > '00:00:00'
        AND sc.titulo NOT LIKE '%DEMO%'
        AND sc.titulo NOT LIKE '%INSTALACIÓN%'
        AND sc.curso_id NOT IN (${blacklistPrograms.join(',')}) 
        ${programId || customPrograms.length === 0 ? '' : `AND sc.curso_id NOT IN (${customPrograms.join(',')})`}
        AND sc.asistencia = 'S'
    `)

    if (courses.length === 0) return listCoursesEmails

    for (const course of courses) {
      const [emails] = await connection.query<Email[]>(`
        SELECT u.correo as name
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
        emails: splitIntoGroups(emails.map((email) => formatText(email.name)), 25)
      })
    }

    return listCoursesEmails
  } catch (error) {
    console.log(error)
    return []
  }
}
export async function sendEmailSessionReminder ({ typeTime, programId }: { typeTime: 'N' | 'T' | 'C', programId?: number }) {
  try {
    const listCoursesEmails = await getEmailsSessionReminderList({ typeTime, programId })

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

export async function getEmailsInstallmentDueReminderList ({ typeProgram, days }: { typeProgram: 'C' | 'D', days: number }) {
  try {
    const typesPrograms: { [key: string]: string } = {
      C: 'cuota_curso as c INNER JOIN curso as p ON c.curso_id = p.curso_id',
      D: 'cuota_diplomado as c INNER JOIN diplomado as p ON c.diplomado_id = p.diplomado_id'
    }

    const listInstallmentsEmails: { id: number, email: string, studentName: string, programName: string, cod: string, amount: number, expireDate: string, advisorNumber: string }[] = []

    const [installments] = await connection.query<Installments[]>(`
        SELECT
            ${typeProgram === 'C' ? 'p.curso_id' : 'p.diplomado_id'} as id,
            u.nombres as studentName,
            u.apellidos as studentSurname,
            u.correo as email,
            p.titulo as programName,
            c.codigo as cod,
            c.monto as amount,
            c.fecha_vencimiento as expireDate,
            ${typeProgram === 'C' ? 'p.dirigido' : 'p.asesor'} as advisors
        FROM ${typesPrograms[typeProgram]}
        INNER JOIN usuario as u ON c.usuario_id = u.usuario_id
        WHERE c.fecha_vencimiento = CURDATE() + INTERVAL ${days} DAY
        AND c.estado = 'P'
        AND u.usuario_id NOT IN (${blacklistUsers.join(',')})
    `)

    if (installments.length === 0) return listInstallmentsEmails

    for (const installment of installments) {
      const advisorsId: string[] = JSON.parse(installment.advisors)

      const [advisor] = await connection.query<Advisor[]>('SELECT u.celular as mobile, u.telefono as phone FROM usuario as u WHERE u.usuario_id = ? LIMIT 1', [advisorsId[0]])

      const advisorNumber = advisor.length > 0 ? advisor[0].mobile || advisor[0].phone : SUPPORTS_NUMBER[0]

      listInstallmentsEmails.push({
        id: installment.id,
        email: formatText(installment.email),
        studentName: `${formatText(installment.studentName, 'upper')} ${formatText(installment.studentSurname[0], 'upper')}.`,
        cod: installment.cod,
        programName: formatText(installment.programName, 'upper'),
        amount: installment.amount,
        expireDate: installment.expireDate,
        advisorNumber
      })
    }

    return listInstallmentsEmails
  } catch (error) {
    console.log(error)
    return []
  }
}
export async function sendEmailInstallmentDueReminder ({ typeProgram, days }: { typeProgram: 'C' | 'D', days: number }) {
  try {
    const listInstallmentsEmails = await getEmailsInstallmentDueReminderList({ typeProgram, days })

    if (listInstallmentsEmails.length === 0) return false

    for (const installmentEmail of listInstallmentsEmails) {
      const template = getTemplateInstallmentDueReminder(installmentEmail)
      const response = await sendEmail({
        from: FROM_EMAIL,
        to: [installmentEmail.email],
        subject: 'Recordatorio de Vencimiento de Cuota',
        html: template
      })

      const message = response.status ? `Enviado a ${installmentEmail.email} del programa (${installmentEmail.id})-${installmentEmail.programName}` : `Error: ${response.message}`

      try {
        await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [response.status, message, 2])
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
