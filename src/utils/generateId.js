/**
 * Generate a unique ID for different entities
 * @param {string} prefix - Prefix for ID (e.g., USR, RES)
 * @returns {string} - Formatted ID
 */
const generateId = (prefix) => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NFC-${prefix}-${timestamp}${random}`;
  };
  
  module.exports = {
    generateUserId: () => generateId('USR'),
    generateResourceId: () => generateId('RES')
  };