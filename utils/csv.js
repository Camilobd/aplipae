import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Excel en español usa ";" como separador de columnas. Si prefieres coma, cámbialo aquí.
export const SEPARADOR = ';';

function celda(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (texto.includes(SEPARADOR) || texto.includes('"') || texto.includes('\n') || texto.includes('\r')) {
    return '"' + texto.replace(/"/g, '""') + '"';
  }
  return texto;
}

// La marca \uFEFF hace que Excel reconozca las tildes
export function aTextoCsv(filas) {
  return '\uFEFF' + filas.map((fila) => fila.map(celda).join(SEPARADOR)).join('\r\n');
}

export function nombreSeguro(texto) {
  const limpio = String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return limpio || 'reporte';
}

// Decimal con coma, como lo espera Excel en español
export function decimal(numero, cifras = 1) {
  return Number(numero).toFixed(cifras).replace('.', ',');
}

export async function compartirCsv(nombreArchivo, filas) {
  const archivo = new File(Paths.cache, nombreArchivo);
  if (archivo.exists) archivo.delete();
  await Promise.resolve(archivo.create());
  await Promise.resolve(archivo.write(aTextoCsv(filas)));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este teléfono no permite compartir archivos.');
  }
  await Sharing.shareAsync(archivo.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exportar CSV',
    UTI: 'public.comma-separated-values-text',
  });
}