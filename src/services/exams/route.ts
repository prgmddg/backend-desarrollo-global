import { Request, Response, Router } from 'express'
import { verifyToken } from '../../utils/jwt'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import connection from '../../database/connection'
import { RowDataPacket } from 'mysql2'
import { formatText } from '../../utils/format'

interface Answer extends RowDataPacket {
  id: number
  statement: string
  right: string
}

interface Question extends RowDataPacket {
  id: number
  statement: string
  answers: Answer[]
}

interface Exam extends RowDataPacket {
  id: number
  title: string
  description: string
  type: string
  questions?: Question[]
}

const answersLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

export const router = Router()

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const authorization = req.headers.authorization
    if (!authorization) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const [type, token] = authorization.split(' ')
    if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const data = verifyToken<string>(token)
    if (!data) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const id = req.params.id

    const [exams] = await connection.query<Exam[]>(`
      SELECT
          examen_id as id,
          titulo as title,
          descripcion as description,
          modalidad as type
          FROM examen WHERE examen_id = ?
    `, [id])

    if (exams.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })

    const paragraphs: Paragraph[] = []
    const exam = exams[0]

    exam.title = formatText(exam.title, 'lower')
    exam.description = formatText(exam.description, 'lower')

    const [questions] = await connection.query<Question[]>(`
      SELECT
          pregunta_id as id,
          descripcion as statement
          FROM pregunta WHERE examen_id = ?
    `, [exam.id])

    let i = 0

    for (const question of questions) {
      const [answers] = await connection.query<Answer[]>(`
            SELECT
                respuesta_id as id,
                descripcion as statement,
                validez as 'right'
                FROM respuesta WHERE pregunta_id = ?
        `, [question.id])

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: '',
            bold: true,
            size: 20,
            font: 'Arial'
          })
        ]
      }))

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: `${i + 1}) ${formatText(question.statement)}`,
            bold: true,
            size: 20,
            font: 'Arial'
          })
        ]
      }))

      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: '',
            size: 5,
            font: 'Arial'
          })
        ]
      }))

      answers.forEach((answer, index) => {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: `${answersLetters[index]}) ${formatText(answer.statement)}`,
              size: 20,
              bold: answer.right === 'VER',
              font: 'Arial'
            })
          ]
        }))
      })

      i++
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 500,
                right: 500,
                bottom: 500,
                left: 500
              }
            }
          },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: exam.title.toUpperCase(),
                  bold: true,
                  size: 20,
                  font: 'Arial'
                })
              ]
            }),
            ...paragraphs
          ]
        }
      ]
    })

    const buffer = await Packer.toBuffer(doc)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', 'attachment; filename=archivo.docx')

    res.send(buffer)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_SERVER' })
  }
})

export default router
