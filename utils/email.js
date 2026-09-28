import { EMAILJS_CONFIG } from '../emailConfig';

export async function enviarPinPorCorreo(email, nombre, pin) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_CONFIG.serviceId,
      template_id: EMAILJS_CONFIG.templateId,
      user_id: EMAILJS_CONFIG.publicKey,
      accessToken: EMAILJS_CONFIG.privateKey,
      template_params: {
        to_email: email,
        aforador_nombre: nombre,
        pin: pin,
      },
    }),
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error('Error enviando correo: ' + texto);
  }
}