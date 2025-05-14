/**
 * Generate a unique ID for different miscellaneous entities
 * @param {string} prefix - Prefix for ID (e.g., BCT, POL)
 * @returns {string} - Formatted ID
 */
const generateId = (prefix) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `NFC-${prefix}-${timestamp}${random}`;
};

// Export existing functions plus the new ones
module.exports = {
  generateBroadcastId: () => generateId('BCT'),
  generatePollId: () => generateId('POL')
};