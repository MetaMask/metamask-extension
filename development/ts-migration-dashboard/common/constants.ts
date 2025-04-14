// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31890
// eslint-disable-next-line import/no-nodejs-modules
import path from 'path';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
export const ROOT_DIRECTORY_PATH = path.resolve(__dirname, '../../..');
export const PROJECT_DIRECTORY_PATH = path.join(
  ROOT_DIRECTORY_PATH,
  'development',
  'ts-migration-dashboard',
);
export const COMMON_DIRECTORY_PATH = path.join(
  PROJECT_DIRECTORY_PATH,
  'common',
);
export const APP_DIRECTORY_PATH = path.join(PROJECT_DIRECTORY_PATH, 'app');
export const INTERMEDIATE_BUILD_DIRECTORY_PATH = path.join(
  PROJECT_DIRECTORY_PATH,
  'build',
  'intermediate',
);
export const FINAL_BUILD_DIRECTORY_PATH = path.join(
  PROJECT_DIRECTORY_PATH,
  'build',
  'final',
);
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
export const FILES_TO_CONVERT_PATH = path.join(
  PROJECT_DIRECTORY_PATH,
  'files-to-convert.json',
);
