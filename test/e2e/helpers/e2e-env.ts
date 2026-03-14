import * as fs from 'fs';
import * as path from 'path';

/**
 * Load environment variables from .env.e2e file
 * This file contains sensitive test data like private keys
 */
export function loadE2EEnv(): Record<string, string> {
  const envPath = path.join(__dirname, '../.env.e2e');
  const env: Record<string, string> = {};

  if (!fs.existsSync(envPath)) {
    console.warn(
      '[E2E ENV] Warning: .env.e2e file not found. Please create it from .env.e2e.example',
    );
    return env;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  }

  return env;
}

/**
 * Get a required environment variable from .env.e2e
 * Throws an error if the variable is not set or has a placeholder value
 * @param key
 */
export function getRequiredE2EEnv(key: string): string {
  const env = loadE2EEnv();
  const value = env[key];

  if (!value) {
    throw new Error(
      `[E2E ENV] Required environment variable "${key}" is not set in test/e2e/.env.e2e`,
    );
  }

  // Check for placeholder values
  const placeholders = [
    'your_private_key_from_here',
    'your_private_key_to_here',
    '0x0000000000000000000000000000000000000000',
  ];

  if (placeholders.includes(value)) {
    throw new Error(
      `[E2E ENV] Environment variable "${key}" has a placeholder value. Please set a real value in test/e2e/.env.e2e`,
    );
  }

  return value;
}

/**
 * Get an optional environment variable from .env.e2e
 * Returns the default value if not set
 * @param key
 * @param defaultValue
 */
export function getOptionalE2EEnv(
  key: string,
  defaultValue: string = '',
): string {
  const env = loadE2EEnv();
  return env[key] || defaultValue;
}
