export default function getTemplateInHousePer ({ programName }: { programName: string }) {
  const formatProgramName = programName.toUpperCase()

  return `
  <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Última Sesión del Curso ${formatProgramName}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #0056b3; text-align: center;">Última Sesión del Curso: ${formatProgramName}</h2>
        <p>Estimados participantes,</p>
        <p>Les recordamos que <strong>hoy es la última sesión del curso ${formatProgramName}</strong>. Por favor, asegúrense de ingresar puntualmente, ya que se desarrollará el <strong>examen final</strong> durante la sesión.</p>
        <h3>Detalles importantes sobre el examen:</h3>
        <ul>
            <li><strong>Inicio:</strong> 7:00 pm.</li>
            <li><strong>Disponibilidad:</strong> Hasta el término de la sesión.</li>
            <li><strong>Oportunidades:</strong> Contarán con <strong>3 intentos</strong> para completar su examen teórico.</li>
        </ul>
        <p><strong>Nota:</strong> Es fundamental que ingresen a la clase para rendir el examen. En caso contrario, se les asignará automáticamente una <strong>nota desaprobatoria</strong>.</p>
        <p style="margin-top: 20px;">Saludos cordiales,</p>

        <!-- Firma -->
        <table style="font-family: -apple-system,BlinkMacSystemFont,segoe ui,Roboto,Helvetica,Arial,sans-serif,apple color emoji,segoe ui emoji,segoe ui symbol; background-color: white; margin-top: 20px;">
            <tbody>
                <tr>
                    <td>
                        <img width="100" height="110" alt="perfil" src="https://archivos-comunes.s3.amazonaws.com/2023/Foto+para+Firma+Dayana+Rivera.png">
                    </td>
                    <td style="border-left-width: 9px; border-left-style: solid; border-left-color: rgb(255 255 255 / 0%);">
                        <div style="display: grid; line-height: 170%; width: 200px;">
                            <span style="font-weight: 700; font-size: 1.35em;">Dayana Rivera</span>
                            <span style="font-size: 1.22em; letter-spacing: 0.05em;">Asistente académica</span>
                        </div>
                        <div style="margin-top: 9px; line-height: 130%; width: 200px;">
                            <a href="https://api.whatsapp.com/send?phone=51990945941" style="display: flex; gap: 5px; align-items: center; text-decoration: none; color: black;">
                                <img width="20" alt="logo-whatsapp" src="https://archivos-comunes.s3.amazonaws.com/whatsapp.png">
                                <span style="font-weight: 500; font-size: 1.22em;">990 945 941</span>
                            </a>
                            <a href="https://desarrolloglobal.pe" style="display: flex; gap: 5px; align-items: center; text-decoration: none; color: black;">
                                <span style="font-weight: 400; font-size: 1.11em;">www.desarrolloglobal.pe</span>
                            </a>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <div style="background-color: #0057b9; width: 100%; height: 2px;"></div>
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        <div style="display: grid; text-align: center;">
                            <img alt="logo" style="margin-top: 5px; margin-bottom: 5px;" width="300" src="https://download-archivos.s3.amazonaws.com/logo-bg-logo.png">
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
  `
}
