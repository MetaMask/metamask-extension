import humanizeDuration from 'humanize-duration';
import { setTimeout } from 'node:timers/promises';
import * as xml2js from 'xml2js';

// This helper function checks if version has the correct format: "x.y.z" where "x", "y" and "z" are numbers.
export function isValidVersionFormat(str: string): boolean {
  const regex = /^\d+\.\d+\.\d+$/;
  return regex.test(str);
}

// This helper function checks if a string has the date format "YYYY-MM-DD".
export function isValidDateFormat(dateString: string): boolean {
  // Regular expression to match the date format "YYYY-MM-DD"
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Check if the dateString matches the regex
  if (!dateFormatRegex.test(dateString)) {
    return false;
  }

  // Parse the date components
  const [year, month, day] = dateString.split('-').map(Number);

  // Check if the date components form a valid date
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// This helper function generates the current date in that format: "YYYY-MM-DD"
export function getCurrentDateFormatted(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based, so add 1
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// This mapping is used to know what planning repo is used for each code repo
export const codeRepoToPlanningRepo: { [key: string]: string } = {
  'metamask-extension': 'MetaMask-planning',
  'metamask-mobile': 'mobile-planning',
};

// This mapping is used to know what platform each code repo is used for
export const codeRepoToPlatform: { [key: string]: string } = {
  'metamask-extension': 'extension',
  'metamask-mobile': 'mobile',
};

export async function retry<T extends (...args: any[]) => any>(
  fn: T,
  { retries = 3, delay = 5000 } = { retries: 3, delay: 5000 },
): Promise<Awaited<ReturnType<T>>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(
        `Attempt ${attempt} failed: ${
          err instanceof Error ? err.message : String(err)
        }. Retrying in ${delay}ms...`,
      );
      await setTimeout(delay);
      delay *= 2;
    }
  }
  throw new Error('Retries exhausted');
}

export function normalizeTestPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return normalized.slice(normalized.indexOf('test/'));
}

export const XML = {
  parse: new xml2js.Parser().parseStringPromise,
};

const humanizer = humanizeDuration.humanizer({
  language: 'shortEn',
  languages: {
    shortEn: {
      y: () => 'y',
      mo: () => 'mo',
      w: () => 'w',
      d: () => 'd',
      h: () => 'h',
      m: () => 'm',
      s: () => 's',
      ms: () => 'ms',
    },
  },
  delimiter: ' ',
  spacer: '',
  round: true,
});

export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return humanizer(ms);
}

/**
 * Replaces HTML `<strong>` tags with ANSI escape codes to format
 * text as bold in the console output.
 */
export function consoleBold(str: string): string {
  return str
    .replaceAll('<strong>', '\x1b[1m')
    .replaceAll('</strong>', '\x1b[0m');
}
