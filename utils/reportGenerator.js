// utils/reportGenerator.js

/**
 * Genera un reporte básico en formato JSON o CSV (puedes ampliar)
 * @param {Array<Object>} data
 * @param {string} format - 'json' o 'csv'
 * @returns {string} contenido del reporte
 */
export function generateReport(data, format = 'json') {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  if (format === 'csv') {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    return headers + '\n' + rows;
  }
  throw new Error('Formato de reporte no soportado');
}
