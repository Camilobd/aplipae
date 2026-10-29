// Rechaza si la promesa no termina a tiempo (sin conexión, algunas llamadas se quedan esperando)
export function conTiempo(promesa, ms, mensaje = 'Tiempo de espera agotado') {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error(mensaje)), ms);
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}