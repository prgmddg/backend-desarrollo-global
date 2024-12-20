import { Request, Response, Router } from 'express'
import { RowDataPacket } from 'mysql2'
import connection from '../../database/connection'
import getTemplateSessionReminder from '../emails/templates/getTemplateSessionReminder'
import getTemplateInstallmentDueReminder from '../emails/templates/getTemplateInstallmentDueReminder'
import { sendEmail } from '../emails/emails.service'
import getTemplateWelcomeInHouse from '../emails/templates/getTemplateWelcomeInHouse'
import getTemplateInHousePer from '../emails/templates/getTemplateInhousePer'
import { splitIntoGroups } from '../../utils/format'
import getTemplateExamen from '../emails/templates/getTemplateExamen'
import getTemplateSesionGrabada from '../emails/templates/getTemplateSesionGrabada'

interface TaskLogs {
    status: boolean,
    message: string,
    createdAt: string
}

interface Task {
  id: number
  name: string
  time: string
  timesExecuted: number
  type: string
  executions: TaskLogs[]
  template: string
  status: boolean
}

interface Logs extends RowDataPacket {
    id: number,
    status: boolean,
    message: string,
    created_at: string
}

export const router = Router()

const tasks: Task[] = [
  {
    id: 1,
    name: 'recordatorio de sesión',
    time: '17:00:00',
    timesExecuted: 0,
    type: 'e',
    executions: [],
    template: getTemplateSessionReminder({
      url: 'https://us02web.zoom.us/j/1234567890',
      id: 1000,
      sessionName: 'Sesión de prueba',
      startSession: '17:00',
      dateSession: '2022-10-10',
      programName: 'Programa de prueba',
      typeTime: 'N',
      teacherName: 'Profesor de prueba',
      emails: []
    }),
    status: true
  }, {
    id: 2,
    name: 'recordatorio de vencimiento de cuota',
    time: '00:00:00',
    timesExecuted: 0,
    type: 'e',
    executions: [],
    template: getTemplateInstallmentDueReminder({
      studentName: 'Estudiante de prueba',
      programName: 'Programa de prueba',
      cod: '123456',
      amount: 100,
      expireDate: '2022-10-10',
      advisorNumber: '999999999'
    }),
    status: true
  },
  {
    id: 3,
    name: 'desactivar descarga de clases',
    time: '00:00:00',
    timesExecuted: 0,
    type: 't',
    executions: [],
    template: '',
    status: true
  },
  {
    id: 4,
    name: 'desactivar acceso de exámenes',
    time: '00:00:00',
    timesExecuted: 0,
    type: 't',
    executions: [],
    template: '',
    status: true
  },
  {
    id: 5,
    name: 'correo de bienvenida - In House',
    time: '00:00:00',
    timesExecuted: 0,
    type: 'e',
    executions: [],
    template: getTemplateWelcomeInHouse({
      url: 'https://us02web.zoom.us/j/1234567890',
      os: 'OS-2024',
      companyName: 'Centro de Capacitación y Desarrollo Global',
      email: 'info@desarrolloglobal.pe',
      name: 'CCARHUAPOMA REYES MILAGROS FIORELLA',
      dni: '60917003'
    }),
    status: true
  }
]

function groupsDates (logs: TaskLogs[]) {
  const years = logs.map(log => new Date(log.createdAt).toLocaleDateString('es-PE'))

  return Array.from(new Set(years))
}

function groupYearsAndMonths (logs: TaskLogs[]) {
  const dates = groupsDates(logs)

  const formatLogs = []

  for (const date of dates) {
    formatLogs.push({
      date,
      logs: logs.filter(log => new Date(log.createdAt).toLocaleDateString('es-PE') === date)
    })
  }

  return formatLogs
}

router.get('/', async (req: Request, res: Response) => {
  const { type } = req.query as { type ?: string }

  const tasksFiltered = tasks.filter(task => {
    if (type) {
      return task.type === type
    }

    return true
  })

  for (const task of tasksFiltered) {
    const [logs] = await connection.query<Logs[]>(`
      SELECT
            id,
            status,
            message,
            created_at
      FROM logs_task
        WHERE task_id = ?
    `, task.id)

    if (logs.length === 0) continue

    task.executions = logs.map(log => ({ status: log.status, message: log.message, createdAt: log.created_at }))
    task.timesExecuted = task.executions.length
  }

  return res.status(200).json({
    total: tasksFiltered.length,
    tasks: tasksFiltered
  })
})

router.get('/:id', async (req: Request, res: Response) => {
  const task = tasks.find(task => task.id === Number(req.params.id))

  if (!task) return res.status(404).json({ error: 'NOT_FOUND' })

  const [logs] = await connection.query<Logs[]>(`
      SELECT
            id,
            status,
            message,
            created_at
      FROM logs_task
        WHERE task_id = ?
    `, task.id)

  if (logs.length === 0) return res.status(200).json(task)

  task.executions = logs.map(log => ({ status: log.status, message: log.message, createdAt: log.created_at }))
  task.timesExecuted = task.executions.length

  const { executions, ...rest } = task
  return res.status(200).json({ ...rest, executions: groupYearsAndMonths(executions) })
})

router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const { os, url, data, programName, companyName, urlWhatsapp } = req.body as { os: string, url: string, urlWhatsapp?: string, programName?: string, companyName?: string, data: { name: string, email: string, dni: string }[] }
    const { id } = req.params as { id: string }

    if (!programName || !companyName) return res.status(400).json({ error: 'BAD_REQUEST' })

    const emailsValid = []
    const emailsInvalid = []

    if (id === '6') {
      const emails = data.map(d => d.email)

      const response = await sendEmail({
        from: 'info@desarrolloglobal.pe',
        to: emails,
        subject: `Última Sesión del Curso ${programName.toUpperCase()}`,
        html: getTemplateInHousePer({ programName })
      })

      if (response.status) {
        emailsValid.push(emails)
      } else {
        emailsInvalid.push(emails)
      }

      const message = `correctos: ${emails.length} correos enviados correctamente del programa ${programName.toUpperCase()}`

      await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [true, message, 9])

      return res.status(200).json({ message: 'SUCCESS' })
    }

    if (id === '7') {
      const emails = splitIntoGroups(data.map(d => d.email), 25)

      for (const email of emails) {
        await sendEmail({
          from: 'info@desarrolloglobal.pe',
          to: email,
          subject: `Recordatorio de Examen Final ${programName.toUpperCase()}`,
          html: getTemplateExamen()
        })

        const message = `correctos: ${email.length} correos enviados correctamente del programa ${programName.toUpperCase()}`

        await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [true, message, 10])
      }

      return res.status(200).json({ message: 'SUCCESS' })
    }

    if (id === '8') {
      const emails = splitIntoGroups(data.map(d => d.email), 25)

      for (const email of emails) {
        await sendEmail({
          from: 'info@desarrolloglobal.pe',
          to: email,
          subject: `Disponibilidad de la Sesión 02 del Curso ${programName.toUpperCase()}`,
          html: getTemplateSesionGrabada()
        })

        const message = `correctos: ${email.length} correos enviados correctamente del programa ${programName.toUpperCase()}`

        await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [true, message, 11])
      }

      return res.status(200).json({ message: 'SUCCESS' })
    }

    for (const d of data) {
      const response = await sendEmail({
        from: 'info@desarrolloglobal.pe',
        to: [d.email],
        subject: 'Registro de Capacitación',
        html: getTemplateWelcomeInHouse({ ...d, companyName, os, url, urlWhatsapp })
      })

      if (response.status) {
        emailsValid.push(d.email)
      } else {
        emailsInvalid.push(d.email)
      }
    }

    const message = `correctos: ${emailsValid.length} incorrectos: ${emailsInvalid.length} correos de bienvenida enviados correctamente del programa ${programName.toUpperCase()}`

    await connection.query('INSERT INTO logs_task ( status, message, task_id ) VALUES (?, ?, ?)', [true, message, 5])

    return res.status(200).json({ message: 'SUCCESS' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
})

export default router
