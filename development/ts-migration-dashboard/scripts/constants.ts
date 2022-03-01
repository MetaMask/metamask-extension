import path from 'path';

export const BASE_DIRECTORY = path.resolve(__dirname, '../../..');
export const ENTRYPOINT_PATTERNS = [
  'app/scripts/background',
  'app/scripts/contentscript',
  'app/scripts/disable-console',
  'app/scripts/inpage',
  'app/scripts/phishing-detect',
  'app/scripts/sentry-install',
  'app/scripts/ui',
  'development/build/index',
  '**/*.stories',
  '**/*.test',
];
