/**
 * Update the generateId utility to include visitor ID generation
 */
const generateId = (prefix) => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NFC-${prefix}-${timestamp}${random}`;
  };
  
  // Export existing functions plus the new one
  module.exports = {
    generateUserId: () => generateId('USR'),
    generateResourceId: () => generateId('RES'),
    generateVisitorId: () => generateId('VIS')
  };