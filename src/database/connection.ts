import { createPool } from 'mysql2/promise'

export const connection = createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  idleTimeout: 50000,
  enableKeepAlive: true,
  charset: 'latin1'
})

export default connection
