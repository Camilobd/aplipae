import { EMAILJS_CONFIG } from '../emailConfig';

const URL_EMAILJS = 'https://api.emailjs.com/api/v1.0/email/send';

async function enviar(templateId, params) {
  const res = await fetch(URL_EMAILJS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: templateId,
      user_id: EMAILJS_CONFIG.publicKey,
      accessToken: EMAILJS_CONFIG.privateKey,
      template_params: params,
    }),
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error('Error enviando correo: ' + texto);
  }
}

export async function enviarPinPorCorreo(email, nombre, pin) {
  await enviar(EMAILJS_CONFIG.templateId, {
    to_email: email,
    aforador_nombre: nombre,
    pin,
  });
}

export async function enviarNotificacionPorCorreo({ email, nombre, interseccion, fechaHora, detalleHtml }) {
  if (!EMAILJS_CONFIG.templateNotificacionId) {
    throw new Error('Falta templateNotificacionId en emailConfig.js');
  }
  await enviar(EMAILJS_CONFIG.templateNotificacionId, {
    to_email: email,
    aforador_nombre: nombre,
    interseccion,
    fecha_hora: fechaHora,
    detalle: detalleHtml,
  });
}