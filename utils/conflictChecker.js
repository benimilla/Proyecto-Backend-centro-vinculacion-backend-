// utils/conflictChecker.js

/**
 * Verifica si existe conflicto entre dos rangos horarios
 * @param {Date} start1 - inicio del rango 1
 * @param {Date} end1 - fin del rango 1
 * @param {Date} start2 - inicio del rango 2
 * @param {Date} end2 - fin del rango 2
 * @returns {boolean} true si hay conflicto
 */
function hasConflict(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

module.exports = { hasConflict };
