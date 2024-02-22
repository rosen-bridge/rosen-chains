import { randomBytes } from 'crypto';

export const generateRandomId = (): string => randomBytes(32).toString('hex');
