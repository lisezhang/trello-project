// -------------------------
// Helpers - Pure utility functions
// -------------------------

/**
 * Escape HTML special characters to prevent XSS
 * @param {string|null|undefined} s - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Toggle time input visibility
 * @param {string} inputPrefix - Prefix of the input ID
 * @param {boolean} show - Whether to show or hide
 */
export function toggleTimeInput(inputPrefix, show) {
  const timeInput = document.getElementById(inputPrefix + 'Input');
  if (timeInput) {
    timeInput.style.display = show ? 'block' : 'none';
    if (!show) {
      timeInput.value = '';
    }
  }
}

/**
 * Format a date for display
 * @param {string|null} date - Date in YYYY-MM-DD format
 * @param {string|null} time - Time in HH:MM:SS format
 * @returns {string|null} Formatted date string or null
 */
export function formatDateDisplay(date, time) {
  if (!date) return null;

  // Format date as dd/mm/yyyy
  const [year, month, day] = date.split('-');
  let display = `${day}/${month}/${year}`;

  if (time) {
    display += ` à ${time}`;
  }

  return display;
}

/**
 * Format a date range for display
 * @param {string|null} startDate - Start date in YYYY-MM-DD format
 * @param {string|null} startTime - Start time in HH:MM:SS format
 * @param {string|null} endDate - End date in YYYY-MM-DD format
 * @param {string|null} endTime - End time in HH:MM:SS format
 * @returns {string|null} Formatted date range string or null
 */
export function formatDateRangeDisplay(startDate, startTime, endDate, endTime) {
  const start = formatDateDisplay(startDate, startTime);
  const end = formatDateDisplay(endDate, endTime);

  if (start && end) {
    return `${start} → ${end}`;
  } else if (start) {
    return `Début: ${start}`;
  } else if (end) {
    return `Fin: ${end}`;
  }
  return null;
}

/**
 * Validate URL format
 * @param {string} string - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Convert RGB color string to hex
 * @param {string} rgb - RGB color string (e.g., "rgb(255, 0, 0)")
 * @returns {string} Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(rgb) {
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb.toLowerCase();
  const m = rgb.match(/\d+/g);
  if (!m) return '';
  const r = parseInt(m[0], 10).toString(16).padStart(2, '0');
  const g = parseInt(m[1], 10).toString(16).padStart(2, '0');
  const b = parseInt(m[2], 10).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toLowerCase();
}

/**
 * Get label by ID from labels array
 * @param {number} id - Label ID
 * @param {Array} customLabels - Array of custom labels
 * @returns {Object|undefined} Label object or undefined
 */
export function getLabelById(id, customLabels) {
  return customLabels.find(l => l.id === id);
}
