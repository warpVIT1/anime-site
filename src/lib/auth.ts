import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'anihub-super-secret-key-change-in-production-2026'
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'anihub2026secretencryptionkey32';

// Password hashing (bcrypt - cannot be decrypted)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create search hash (SHA-256 - deterministic)
export function createSearchHash(value: string): string {
  return createHash('sha256').update(value.toLowerCase()).digest('hex');
}

// Encrypt data (AES-256-CBC)
export function encryptData(text: string): string {
  const iv = randomBytes(16);
  const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt data
export function decryptData(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Create JWT token
export async function createToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation (minimum 8 characters, letters and numbers)
export function isValidPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain letters' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain numbers' };
  }
  return { valid: true, message: '' };
}

// Username validation
export function isValidUsername(username: string): { valid: boolean; message: string } {
  if (username.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, message: 'Username must be at most 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Only letters, numbers and underscore allowed' };
  }
  return { valid: true, message: '' };
}
