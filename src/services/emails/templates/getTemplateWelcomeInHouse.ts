import { getFormatDateNow } from '../../../utils/format'

export default function getTemplateWelcomeInHouse ({ os, url, companyName, name, email, dni }: { name: string, email: string, dni: string, os:string, companyName: string, url: string }) {
  const formatDate = getFormatDateNow()
  const formatCompanyName = companyName.toUpperCase()
  const formatOs = os.toUpperCase()
  const formatName = name.toUpperCase()

  return `
  <!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro de Capacitación</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <!-- Header -->
          <tr>
            <td align="center" style="font-size: 18px; font-weight: bold; padding-bottom: 20px;">
              REGISTRO DE INSCRIPCIÓN A LA CAPACITACIÓN VIRTUAL SINCRÓNICA
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td>
              <p style="margin: 0; font-size: 16px; line-height: 1.5;">
                Buen día estimado(a):
              </p>
              <p style="margin: 20px 0; font-size: 16px;">
                Es un placer darle la bienvenida a la presente capacitación, financiada por la <strong>${formatCompanyName}</strong>, registrada en fecha ${formatDate} con código interno <strong>${formatOs}</strong>.
              </p>
              <!-- Steps -->
              <h3 style="margin: 20px 0 10px; font-size: 16px;">Ingrese y verifique la activación de sus accesos:</h3>
              <p style="margin: 5px 0;"><strong>Paso 1:</strong> Hacer clic en: <a href="https://aula.desarrolloglobal.pe/login" style="color: #0073e6;">https://aula.desarrolloglobal.pe/login</a></p>
              <p style="margin: 5px 0;"><strong>Paso 2:</strong> Digite:</p>
              <p style="margin: 5px 0;"><strong>Usuario:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong>${dni}</p>
              <!-- Platform Information -->
              <h3 style="margin: 20px 0 10px; font-size: 16px;">Usted podrá encontrar en la plataforma:</h3>
              <ul style="margin: 0 0 20px 20px; padding: 0; font-size: 16px;">
                <li>Material de cada sesión para descargar (Pestaña Material).</li>
                <li>Evaluaciones.</li>
                <li>La clase realizada estará grabada para repasar.</li>
              </ul>
              <p style="margin: 20px 0; font-size: 16px;">
                Asimismo, recibirá un mensaje desde el Aula Virtual reiterando los accesos y guía de uso.
              </p>
              <!-- WhatsApp Group -->
              <p style="margin: 20px 0; font-size: 16px;">
                Unirse al grupo de WhatsApp dando clic aquí: <a href="#" style="color: #0073e6;">[Enlace al grupo]</a>
              </p>
              <p style="margin: 20px 0; font-size: 16px;">
                Por este medio recibirá las notificaciones del desarrollo de la clase. Evite salir del grupo hasta el término de las clases.
              </p>
              <!-- User Verification -->
              <h3 style="margin: 20px 0 10px; font-size: 16px;">Verifique sus datos de certificación:</h3>
              <ul style="margin: 0 0 20px 20px; padding: 0; font-size: 16px;">
                <li><strong>Nombres y Apellidos:</strong>${formatName}</li>
                <li><strong>N° Celular:</strong>${dni}</li>
              </ul>
              <!-- Recommendations -->
              <h3 style="margin: 20px 0 10px; font-size: 16px;">RECOMENDACIONES</h3>
              <ul style="margin: 0 0 20px 20px; padding: 0; font-size: 16px;">
                <li>En caso de que no haya usado <strong>ZOOM</strong> anteriormente, instale en la laptop o PC que usará para recibir clases desde aquí: <a href="${url}" style="color: #0073e6;">Instalar ZOOM</a></li>
                <li>Evite ingresar desde un móvil (smartphone).</li>
              </ul>
              <!-- Final Notes -->
              <h3 style="margin: 20px 0 10px; font-size: 16px;">Al finalizar la capacitación:</h3>
              <ul style="margin: 0 0 20px 20px; padding: 0; font-size: 16px;">
                <li>Usted obtendrá 1 CERTIFICADO A NOMBRE DE DESARROLLO GLOBAL</li>
              </ul>
              <!-- Terms and Conditions -->
              <h3 style="margin: 20px 0 10px; font-size: 16px;">TÉRMINOS Y CONDICIONES</h3>
              <ol style="margin: 0 0 20px 20px; padding: 0; font-size: 16px;">
                <li>Para recibir la certificación por aprobación, el alumno deberá resolver todas las evaluaciones y obtener un promedio superior a catorce (14). En caso contrario, se emitirá únicamente una constancia de participación.</li>
                <li>La entrega de certificaciones o constancias está sujeta al pago del servicio. Se pueden considerar excepciones en coordinación con el encargado de la entidad.</li>
                <li>La certificación física será entregada al coordinador designado por la entidad.</li>
              </ol>
              <p style="margin: 20px 0; font-size: 16px;">Con atentos saludos,</p>
              <p style="margin: 0; font-size: 16px;">Equipo de Capacitación</p>
            </td>
          </tr>
          <!-- Signature -->
          <tr>
            <td colspan="2" style="padding-top: 20px;">
              <table style="font-family:-apple-system,BlinkMacSystemFont,segoe ui,Roboto,Helvetica,Arial,sans-serif,apple color emoji,segoe ui emoji,segoe ui symbol; background-color: white;">
                <tbody>
                  <tr>
                    <td>
                      <img width="100" height="110" alt="perfil" src="https://archivos-comunes.s3.amazonaws.com/2023/Foto+para+Firma+Dayana+Rivera.png">
                    </td>
                    <td style="border-left-width: 9px;border-left-style: solid;border-left-color: rgb(255 255 255 / 0%);">
                      <div style="display: grid;line-height: 170%; width: 200px;">
                        <span style="font-weight: 700;font-size: 1.35em">Dayana Rivera</span>
                        <span style="font-size: 1.22em;letter-spacing: 0.05em;">Asistente académica</span>
                      </div>
                      <div style="margin-top: 9px;line-height: 130%; width: 200px;">
                        <a href="https://api.whatsapp.com/send?phone=51990945941" style="display: flex; gap: 5px;align-items: center;text-decoration: none;color: black;">
                          <img width="20" alt="logo-whatsapp" src="https://archivos-comunes.s3.amazonaws.com/whatsapp.png">
                          <span style="font-weight: 500;font-size: 1.22em;">990 945 941</span>
                        </a>
                        <a href="https://desarrolloglobal.pe" style="display: flex; gap: 5px;align-items: center;text-decoration: none;color: black">
                          <span style="font-weight: 400;font-size: 1.11em">www.desarrolloglobal.pe</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <div style="background-color: #0057b9;width: 100%;height: 2px;"></div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <div style="display: grid;text-align: center;">
                        <img style="margin-top: 5px; margin-bottom: 5px;" width="300" src="https://download-archivos.s3.amazonaws.com/logo-bg-logo.png">
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
