import express, { NextFunction, Request, Response } from 'express'
import { CronJob } from 'cron'

import authRouter from './services/auth/router'
import certificateRouter from './services/certificates/route'
import { sendEmailSessionReminder } from './services/emails/emails.service'

const sessionReminderNow = new CronJob(
  '0 0 17 * * 1-5',
  async () => { await sendEmailSessionReminder({ typeTime: 'N' }) },
  null,
  false,
  'America/Lima'
)

const sessionReminderTomorrow = new CronJob(
  '0 0 20 * * 5',
  async () => { await sendEmailSessionReminder({ typeTime: 'T' }) },
  null,
  false,
  'America/Lima'
)

sessionReminderNow.start()
sessionReminderTomorrow.start()

const PORT = process.env.PORT
const app = express()

app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://crm.desarrolloglobal.pe')
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

app.use('*', (req: Request, res: Response) => res.status(404).json({ path: req.baseUrl === '' ? '/' : req.baseUrl, method: req.method }))

app.listen(PORT, () => console.log('server running'))
