import type { Browser } from './score.mts';

export const BUILD_HOST =
  process.env.DETECTOR_BUILD_HOST ??
  'https://diuv6g5fj9pvx.cloudfront.net/metamask-extension';

export const REPOSITORY =
  process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';

// main-detector-measure.yml downloads the same paths with curl.
export function buildZipUrl(
  browser: Browser,
  run: string,
  version: string,
): string {
  const folder =
    browser === 'firefox' ? 'build-test-mv2-webpack' : 'build-test-webpack';
  return `${BUILD_HOST}/${run}/${folder}/builds/metamask-${browser}-${version}.zip`;
}
