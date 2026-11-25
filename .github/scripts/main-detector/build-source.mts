import type { Browser } from './score.mts';

export const BUILD_HOST =
  process.env.DETECTOR_BUILD_HOST ??
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension';

export const REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';

const RUN_ID = /^\d+$/u;
const VERSION = /^[0-9A-Za-z][0-9A-Za-z.+-]*$/u;

// main-detector-measure.yml downloads the same paths with curl.
export function buildZipUrl(
  browser: Browser,
  run: string,
  version: string,
): string {
  // Both come back from resolve.json, so only path-safe values may reach a URL.
  if (!RUN_ID.test(run) || !VERSION.test(version)) {
    throw new Error(`Invalid build run or version: ${run} ${version}`);
  }
  const folder =
    browser === 'firefox' ? 'build-test-mv2-webpack' : 'build-test-webpack';
  return `${BUILD_HOST}/${run}/${folder}/builds/metamask-${browser}-${version}.zip`;
}
