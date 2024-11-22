import { Request, Response, Router } from 'express'
import { verifyToken } from '../../utils/jwt'
import { Vimeo } from '@vimeo/vimeo'

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
    const vimeo = new Vimeo(
      process.env.VIMEO_CLIENT_ID ?? '',
      process.env.VIMEO_CLIENT_SECRET ?? '',
      process.env.VIMEO_ACCESS_TOKEN ?? ''
    )

    vimeo.request({
      path: `/me/videos/${id}`,
      method: 'GET'
    }, (error, body) => {
      if (error) return res.status(404).json({ error: 'NOT_FOUND' })

      return res.status(200).json({
        statusCode: 200,
        message: 'Success',
        userAgent: req.header('user-agent'),
        data: body.download
      })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_SERVER' })
  }
})

export default router
