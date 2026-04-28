/**
 * PIN Helper Functions - Secure PIN management without external dependencies
 * Uses simple hashing for validation (NOT production-grade encryption)
 * For production: replace with bcrypt or similar
 */

// Simple hash function for PIN validation (NOT crypto-secure - for demo only)
// In production, use bcrypt.hash() and bcrypt.compare()
const simpleHash = (pin) => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Validate PIN format: numeric only, 4-6 digits
 * @param {string} pin - PIN to validate
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validatePINFormat = (pin) => {
  if (!pin) return { valid: false, error: 'PIN is required' };
  if (!/^\d{4,6}$/.test(pin)) {
    return { valid: false, error: 'PIN must be 4-6 digits, numeric only' };
  }
  return { valid: true, error: null };
};

/**
 * Create PIN hash for storage in database
 * @param {string} pin - Employee PIN (4-6 digits)
 * @returns {string} Hashed PIN
 */
export const hashPIN = (pin) => {
  const validation = validatePINFormat(pin);
  if (!validation.valid) throw new Error(validation.error);
  
  // Add timestamp-based salt for basic uniqueness
  const salt = Date.now().toString();
  const combined = `${pin}:${salt}`;
  const hash = simpleHash(combined);
  
  // Return hash with salt for verification
  return `${hash}:${salt}`;
};

/**
 * Verify PIN against stored hash
 * @param {string} inputPin - User input PIN
 * @param {string} storedHash - Hash from database (format: hash:salt)
 * @returns {boolean} True if PIN matches
 */
export const verifyPIN = (inputPin, storedHash) => {
  const validation = validatePINFormat(inputPin);
  if (!validation.valid) return false;
  
  const [hash, salt] = storedHash.split(':');
  const combined = `${inputPin}:${salt}`;
  const inputHash = simpleHash(combined);
  
  return inputHash === hash;
};

/**
 * Validate PINs match
 * @param {string} pin1 - First PIN
 * @param {string} pin2 - Second PIN
 * @returns {object} { valid: boolean, error: string|null }
 */
export const validatePINMatch = (pin1, pin2) => {
  const val1 = validatePINFormat(pin1);
  const val2 = validatePINFormat(pin2);
  
  if (!val1.valid) return val1;
  if (!val2.valid) return val2;
  if (pin1 !== pin2) {
    return { valid: false, error: 'PINs do not match' };
  }
  
  return { valid: true, error: null };
};
