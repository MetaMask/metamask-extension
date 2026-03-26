import { promises as fs } from 'fs';
import path from 'path';

const DEFAULT_EXTENSION_PATH = path.join(process.cwd(), 'dist', 'chrome');

/**
 * Validates that a built extension exists at the given path by checking
 * for the presence of `manifest.json`.
 *
 * @param extensionPath - Path to the built extension directory. Defaults to `<cwd>/dist/chrome`.
 * @returns The resolved `extensionPath` that was validated.
 * @throws Error with a descriptive message when the manifest is missing.
 */
export async function validateExtensionBuilt(
  extensionPath: string = DEFAULT_EXTENSION_PATH,
): Promise<string> {
  const manifestPath = path.join(extensionPath, 'manifest.json');

  try {
    await fs.access(manifestPath);
  } catch {
    throw new Error(
      `Extension not built.\n\n` +
        `Expected manifest at: ${manifestPath}\n\n` +
        `Build the extension first:\n` +
        `  yarn build:test\n\n` +
        `Then try again.`,
    );
  }

  return extensionPath;
}
