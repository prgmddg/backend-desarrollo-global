import { Request, Response, Router } from 'express'
import * as process from 'node:process'

export const router = Router()

router.get('/:document', async (req: Request, res: Response) => {
  const { document } = req.params as { document: string }

  try {
    if (document.length === 8) {
      const response = await fetch(`${process.env.DOCUMENT_URL}/dni`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization:
            `Bearer ${process.env.DOCUMENT_TOKEN}`
        },
        method: 'POST',
        body: JSON.stringify({ dni: document })
      })

      if (!response.ok) return res.status(404).json(await response.json())

      const { success, data } = (await response.json()) as {
        success: boolean,
        data: {
          numero: string,
          nombre_completo: string,
          nombres: string,
          apellido_paterno: string,
          apellido_materno: string,
          codigo_verificacion: string,
        }
      }

      if (!success) return res.status(404).json({ success, data })

      return res.status(200).json({
        document: data.numero,
        names: data.nombres,
        surnames: `${data.apellido_paterno} ${data.apellido_materno}`,
        codVerification: data.codigo_verificacion,
        address: '',
        state: '',
        condition: '',
        location: '',
        department: '',
        province: '',
        district: ''
      })
    }

    if (document.length === 11) {
      const response = await fetch(`${process.env.DOCUMENT_URL}/ruc`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization:
            `Bearer ${process.env.DOCUMENT_TOKEN}`
        },
        method: 'POST',
        body: JSON.stringify({ ruc: document })
      })

      if (!response.ok) return res.status(404).json({ error: 'NOT_FOUND' })

      const { success, data } = (await response.json()) as {
        success: boolean,
        data: {
          'direccion': string,
          'direccion_completa': string
          'ruc': string,
          'nombre_o_razon_social': string,
          'estado': string,
          'condicion': string,
          'departamento': string,
          'provincia': string,
          'distrito': string,
          'ubigeo_sunat': string,
          'ubigeo': string[],
          'es_agente_de_retencion': string,
          'es_buen_contribuyente': string
        }
      }

      if (!success) return res.status(404).json({ error: 'NOT_FOUND' })

      return res.status(200).json({
        names: data.nombre_o_razon_social,
        surnames: '',
        codVerification: '',
        document: data.ruc,
        address: data.direccion_completa,
        state: data.estado,
        condition: data.condicion,
        location: data.ubigeo_sunat,
        department: data.departamento,
        province: data.provincia,
        district: data.distrito
      })
    }

    return res.status(404).json({ error: 'NOT_FOUND' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: 'SERVER_INTERNAL_ERROR' })
  }
})

export default router
