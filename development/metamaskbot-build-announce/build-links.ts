export type BuildType =
  | 'main'
  | 'beta'
  | 'experimental'
  | 'flask'
  | 'test'
  | 'test-flask';

export type BuildBrowser = {
  chrome: string;
  firefox: string;
};

export type BuildLinks = {
  browserify: Record<BuildType, BuildBrowser>;
  webpack: Record<BuildType, BuildBrowser>;
};

/**
 * Returns a map of extension build download links.
 *
 * @param options - Configuration for build link generation.
 * @param options.hostUrl - Base URL for hosted artifacts.
 * @param options.version - The extension version string, e.g., `18.7.25`.
 * @param options.releaseVersion - The (pre)release version of the extension, e.g., the `6` in `18.7.25-flask.6`.
 * @returns `{ browserify, webpack }` each mapping BuildType -> BuildBrowser URLs.
 */
export function getBuildLinks({
  hostUrl,
  version,
  releaseVersion = '0',
}: {
  hostUrl: string;
  version: string;
  releaseVersion?: string;
}): BuildLinks {
  return {
    webpack: {
      main: {
        chrome: `${hostUrl}/build-dist-webpack/builds/metamask-chrome-${version}.zip`,
        firefox: `${hostUrl}/build-dist-mv2-webpack/builds/metamask-firefox-${version}.zip`,
      },
      beta: {
        chrome: `${hostUrl}/build-beta-webpack/builds/metamask-chrome-${version}-beta.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-beta-mv2-webpack/builds/metamask-firefox-${version}-beta.${releaseVersion}.zip`,
      },
      experimental: {
        chrome: `${hostUrl}/build-experimental-webpack/builds/metamask-chrome-${version}-experimental.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-experimental-mv2-webpack/builds/metamask-firefox-${version}-experimental.${releaseVersion}.zip`,
      },
      flask: {
        chrome: `${hostUrl}/build-flask-webpack/builds/metamask-chrome-${version}-flask.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-flask-mv2-webpack/builds/metamask-firefox-${version}-flask.${releaseVersion}.zip`,
      },
      test: {
        chrome: `${hostUrl}/build-test-webpack/builds/metamask-chrome-${version}.zip`,
        firefox: `${hostUrl}/build-test-mv2-webpack/builds/metamask-firefox-${version}.zip`,
      },
      'test-flask': {
        chrome: `${hostUrl}/build-test-flask-webpack/builds/metamask-chrome-${version}-flask.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-test-flask-mv2-webpack/builds/metamask-firefox-${version}-flask.${releaseVersion}.zip`,
      },
    },
    browserify: {
      main: {
        chrome: `${hostUrl}/build-dist-browserify/builds/metamask-chrome-${version}.zip`,
        firefox: `${hostUrl}/build-dist-mv2-browserify/builds/metamask-firefox-${version}.zip`,
      },
      beta: {
        chrome: `${hostUrl}/build-beta-browserify/builds/metamask-beta-chrome-${version}-beta.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-beta-mv2-browserify/builds/metamask-beta-firefox-${version}-beta.${releaseVersion}.zip`,
      },
      experimental: {
        chrome: `${hostUrl}/build-experimental-browserify/builds/metamask-experimental-chrome-${version}-experimental.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-experimental-mv2-browserify/builds/metamask-experimental-firefox-${version}-experimental.${releaseVersion}.zip`,
      },
      flask: {
        chrome: `${hostUrl}/build-flask-browserify/builds/metamask-flask-chrome-${version}-flask.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-flask-mv2-browserify/builds/metamask-flask-firefox-${version}-flask.${releaseVersion}.zip`,
      },
      test: {
        chrome: `${hostUrl}/build-test-browserify/builds/metamask-chrome-${version}.zip`,
        firefox: `${hostUrl}/build-test-mv2-browserify/builds/metamask-firefox-${version}.zip`,
      },
      'test-flask': {
        chrome: `${hostUrl}/build-test-flask-browserify/builds/metamask-flask-chrome-${version}-flask.${releaseVersion}.zip`,
        firefox: `${hostUrl}/build-test-flask-mv2-browserify/builds/metamask-flask-firefox-${version}-flask.${releaseVersion}.zip`,
      },
    },
  };
}
