import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV length
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Derive a secure key using a secret
const SECRET_KEY = process.env.CRYPTO_SECRET || 'MAX24_secure_secret_key_674f32998bc';

function getKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(SECRET_KEY, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

export function encrypt(text: string): string {
  if (!text) return '';
  // If it is already encrypted, do not re-encrypt
  if (isEncrypted(text)) {
    return text;
  }
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(salt);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: salt:iv:authTag:encryptedText
  return `enc:${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  if (!isEncrypted(encryptedText)) {
    return encryptedText;
  }
  
  try {
    const rawContent = encryptedText.substring(4); // remove 'enc:'
    const parts = rawContent.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted text format');
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    
    const key = getKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    throw new Error('Error al desencriptar la clave privada. Verifica las credenciales de encriptación.');
  }
}

export function isEncrypted(text: string): boolean {
  return typeof text === 'string' && text.startsWith('enc:') && text.split(':').length === 5;
}
