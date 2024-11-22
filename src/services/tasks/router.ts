import { Request, Response, Router } from 'express'
import { RowDataPacket } from 'mysql2'
import connection from '../../database/connection'

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
  executions: TaskLogs[]
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
    executions: [],
    status: true
  }, {
    id: 2,
    name: 'recordatorio de vencimiento de cuota',
    time: '00:00:00',
    timesExecuted: 0,
    executions: [],
    status: true
  },
  {
    id: 3,
    name: 'desactivar descarga de clases',
    time: '00:00:00',
    timesExecuted: 0,
    executions: [],
    status: true
  },
  {
    id: 4,
    name: 'desactivar acceso de exámenes',
    time: '00:00:00',
    timesExecuted: 0,
    executions: [],
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
  for (const task of tasks) {
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
    total: tasks.length,
    tasks
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

export default router
