/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a date string (expected in YYYY-MM-DD or standard format) into DD/MM/YY.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  // If it's already in DD/MM/YY or DD/MM/YYYY form, return as-is
  if (dateString.includes('/') && dateString.split('/').length === 3) {
    return dateString;
  }

  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parts[0]; // e.g., '2026'
    const month = parts[1]; // e.g., '06'
    const day = parts[2]; // e.g., '10'
    const yy = year.length === 4 ? year.substring(2) : year;
    return `${day}/${month}/${yy}`;
  }

  // Fallback using vanilla JS Date
  try {
    const d = new Date(dateString);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // Return original if formatting fails
  }

  return dateString;
}
