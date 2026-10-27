import resolveConfig from 'tailwindcss/resolveConfig';
import type { Config } from 'tailwindcss';
import tailwindConfig from '../../../tailwind.config.js';

/**
 * Build-time env var whose value is the Tailwind `md` screen in pixels.
 * Inlined into the extension bundle so runtime code does not import Tailwind.
 */
export const TAILWIND_MD_MIN_WIDTH_ENV = 'TAILWIND_MD_MIN_WIDTH';

/**
 * Reads a min-width pixel length from a resolved Tailwind screen.
 *
 * Accepts the default string form (`768px`) and the object form
 * (`{ min: '768px' }`).
 *
 * @param screen - A resolved `theme.screens` entry.
 * @returns The min width in pixels.
 */
export function parseTailwindMinWidthPx(screen: unknown): number {
  const value = readMinWidthToken(screen);
  const match = /^(\d+)px$/u.exec(value);
  if (!match) {
    throw new Error(
      `Expected a px min-width breakpoint, received ${JSON.stringify(screen)}`,
    );
  }
  return Number(match[1]);
}

let tailwindMdMinWidth: number | undefined;

/**
 * Resolves `theme.screens.md` from the Tailwind config.
 *
 * @returns The `md` breakpoint in pixels.
 */
export function getTailwindMdMinWidth(): number {
  if (tailwindMdMinWidth === undefined) {
    const { md } = resolveConfig(tailwindConfig as Config).theme.screens;
    tailwindMdMinWidth = parseTailwindMinWidthPx(md);
  }
  return tailwindMdMinWidth;
}

function readMinWidthToken(screen: unknown): string {
  if (typeof screen === 'string') {
    return screen.trim();
  }

  if (isMinWidthScreen(screen)) {
    return screen.min.trim();
  }

  throw new Error(
    `Tailwind screen must define a min width, received ${JSON.stringify(screen)}`,
  );
}

function isMinWidthScreen(screen: unknown): screen is { min: string } {
  return (
    screen !== null &&
    typeof screen === 'object' &&
    'min' in screen &&
    typeof screen.min === 'string'
  );
}
