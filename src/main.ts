import express, { NextFunction, Request, Response } from 'express'
import { CronJob } from 'cron'

import authRouter from './services/auth/router'
import certificateRouter from './services/certificates/route'
import videoRouter from './services/videos/route'
import tasksRouter from './services/tasks/router'
import documentRouter from './services/document/route'
import { sendEmailInstallmentDueReminder, sendEmailSessionReminder } from './services/emails/emails.service'
import { disabledDownloads, disabledExams } from './services/tasks/tasks.service'

// [x] recordatorio sesión
// [x] recordatorio cuota
// [ ] desactivar descargas
// [ ] bloquear acceso exámenes

const sessionReminderNow = new CronJob(
  '0 0 17 * * 1-5',
  async () => { await sendEmailSessionReminder({ typeTime: 'N' }) },
  null,
  false,
  'America/Lima'
)

const sessionReminderTomorrow = new CronJob(
  '0 0 20 * * 5',
  async () => {
    await sendEmailSessionReminder({ typeTime: 'T' })
  },
  null,
  false,
  'America/Lima'
)

const disabledDownloadsTask = new CronJob(
  '0 0 0 * * *',
  async () => {
    await disabledDownloads({ days: 7 })
  },
  null,
  false,
  'America/Lima'
)

const disabledExamsTask = new CronJob(
  '0 0 0 * * *',
  async () => {
    await disabledExams({ days: 2 })
  },
  null,
  false,
  'America/Lima'
)

const installmentDueReminder = new CronJob(
  '0 0 0 * * *',
  async () => {
    await sendEmailInstallmentDueReminder({ typeProgram: 'C', days: 0 })
    await sendEmailInstallmentDueReminder({ typeProgram: 'D', days: 0 })
    await sendEmailInstallmentDueReminder({ typeProgram: 'C', days: 1 })
    await sendEmailInstallmentDueReminder({ typeProgram: 'D', days: 1 })
  },
  null,
  false,
  'America/Lima'
)

sessionReminderNow.start()
sessionReminderTomorrow.start()
installmentDueReminder.start()

disabledDownloadsTask.start()
disabledExamsTask.start()

const PORT = process.env.PORT
const app = express()

app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = [
    'https://crm.desarrolloglobal.pe',
    'https://aula.desarrolloglobal.pe'
  ]

  const origin = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : (allowedOrigins.includes(req.headers.origin ?? '') ? req.headers.origin : '')

  res.setHeader('Access-Control-Allow-Origin', origin ?? '')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use('/auth', authRouter)
app.use('/certificates', certificateRouter)
app.use('/download/videos', videoRouter)
app.use('/tasks', tasksRouter)
app.use('/document', documentRouter)

app.use('*', (req: Request, res: Response) => res.status(404).json({ status: 404, path: req.baseUrl === '' ? '/' : req.baseUrl, method: req.method }))

app.listen(PORT, () => console.log('server running'))
