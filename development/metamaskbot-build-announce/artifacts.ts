/**
 * Artifact link construction and PR "Builds ready" section builder.
 */

import {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
} from '../../shared/constants/benchmarks';

/**
 * Check whether an artifact exists.
 *
 * @param url - The URL of the artifact to check.
 * @returns True if the artifact exists, false if it doesn't.
 */
async function artifactExists(url: string): Promise<boolean> {
  const response = await fetch(url, { method: 'HEAD' });
  return response.ok;
}

type ArtifactLink = { url: string; label: string };

type ArtifactLinkMap = {
  bundleSizeData: ArtifactLink;
  bundleSizeStats: ArtifactLink;
  interactionStats: ArtifactLink;
  storybook: ArtifactLink;
  tsMigrationDashboard: ArtifactLink;
  depViz: ArtifactLink;
  allArtifacts: ArtifactLink;
};

export type ArtifactLinks = ArtifactLinkMap & {
  link: (key: keyof ArtifactLinkMap) => string;
};

/**
 * Builds a map of CI artifact URLs and a helper to render HTML links.
 *
 * @param hostUrl - Base URL for hosted artifacts.
 * @param owner - GitHub repo owner.
 * @param repository - GitHub repo name.
 * @param runId - GitHub Actions run ID.
 * @returns Object with artifact URLs and a `link()` helper.
 */
export function getArtifactLinks(
  hostUrl: string,
  owner: string,
  repository: string,
  runId: string,
): ArtifactLinks {
  const ARTIFACT_LINK_MAP: ArtifactLinkMap = {
    bundleSizeData: {
      url: 'https://raw.githubusercontent.com/MetaMask/extension_bundlesize_stats/main/stats/bundle_size_data.json',
      label: 'Bundle Size Data',
    },
    bundleSizeStats: {
      url: `${hostUrl}/bundle-size/bundle_size.json`,
      label: 'Bundle Size Stats',
    },
    interactionStats: {
      url: `${hostUrl}/benchmarks/benchmark-${BENCHMARK_PLATFORMS.CHROME}-${BENCHMARK_BUILD_TYPES.BROWSERIFY}-interactionUserActions.json`,
      label: 'Interaction Stats',
    },
    storybook: {
      url: `${hostUrl}/storybook-build/index.html`,
      label: 'Storybook',
    },
    tsMigrationDashboard: {
      url: `${hostUrl}/ts-migration-dashboard/index.html`,
      label: 'Dashboard',
    },
    depViz: {
      url: `${hostUrl}/lavamoat-viz/index.html`,
      label: 'Build System',
    },
    allArtifacts: {
      url: `https://github.com/${owner}/${repository}/actions/runs/${runId}#artifacts`,
      label: 'all artifacts',
    },
  };

  const link = (key: keyof ArtifactLinkMap) =>
    `<a href="${ARTIFACT_LINK_MAP[key].url}">${ARTIFACT_LINK_MAP[key].label}</a>`;

  return { ...ARTIFACT_LINK_MAP, link };
}

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
 * @returns `{ browserify, webpack }` each mapping BuildType → BuildBrowser URLs.
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
  };
}

/**
 * Renders build links as HTML content rows (e.g. "builds: chrome, firefox").
 *
 * @param buildLinks - BuildLinks from getBuildLinks.
 * @returns Array of HTML strings, one per bundler/build type combination.
 */
function formatBuildLinks(buildLinks: BuildLinks): string[] {
  return Object.entries(buildLinks).flatMap(([bundler, types]) => {
    const prefix = bundler === 'browserify' ? 'builds' : 'webpack builds';
    return (
      Object.entries(types)
        // Experimental builds are only created nightly, not on PRs
        // so we exclude them from the PR comment to avoid confusion.
        .filter(([variant]) => variant !== 'experimental')
        .map(([variant, builds]) => {
          const label = variant === 'main' ? prefix : `${prefix} (${variant})`;
          const links = Object.entries(builds).map(
            ([platform, url]) => `<a href="${url}">${platform}</a>`,
          );
          return `${label}: ${links.join(', ')}`;
        })
    );
  });
}

/** Bundle file roots used for source-map-explorer artifact discovery. */
const FILE_ROOTS = [
  'background',
  'common',
  'ui',
  'content-script',
  'offscreen',
] as const;

/**
 * Discovers source-map-explorer bundle artifacts and returns an HTML markup list.
 *
 * @param hostUrl - Base URL for hosted artifacts.
 * @returns HTML `<ul>` string of discovered bundle links.
 */
async function discoverBundleArtifacts(hostUrl: string): Promise<string> {
  const bundles: Record<string, string[]> = {};

  for (const fileRoot of FILE_ROOTS) {
    bundles[fileRoot] = [];
    let fileIndex = 0;
    let url = `${hostUrl}/source-map-explorer/${fileRoot}-${fileIndex}.html`;
    console.log(`Verifying ${url}`);
    while (await artifactExists(url)) {
      bundles[fileRoot].push(`<a href="${url}">${fileIndex}</a>`);
      fileIndex += 1;
      url = `${hostUrl}/source-map-explorer/${fileRoot}-${fileIndex}.html`;
      console.log(`Verifying ${url}`);
    }
    console.log(`Not found: ${url}`);
  }

  return `<ul>${Object.keys(bundles)
    .map((key) => `<li>${key}: ${bundles[key].join(', ')}</li>`)
    .join('')}</ul>`;
}

/**
 * Builds the collapsible "Builds ready" artifacts body for the PR comment.
 *
 * @param options - Configuration for the artifacts body.
 * @param options.hostUrl - Base URL for hosted artifacts.
 * @param options.version - The extension version string (from package.json).
 * @param options.shortSha - Abbreviated commit hash.
 * @param options.artifacts - Artifact links from getArtifactLinks.
 * @param options.postNewBuilds - Whether to include extension build links.
 * @param options.lavamoatPolicyChanged - Whether to include the LavaMoat viz link.
 * @returns Collapsible HTML string.
 */
export async function buildArtifactsBody({
  hostUrl,
  version,
  shortSha,
  artifacts,
  postNewBuilds,
  lavamoatPolicyChanged,
}: {
  hostUrl: string;
  version: string;
  shortSha: string;
  artifacts: ArtifactLinks;
  postNewBuilds: boolean;
  lavamoatPolicyChanged: boolean;
}): Promise<string> {
  const contentRows: string[] = [];

  if (postNewBuilds) {
    contentRows.push(...formatBuildLinks(getBuildLinks({ hostUrl, version })));
  }

  if (lavamoatPolicyChanged) {
    contentRows.push(`lavamoat build viz: ${artifacts.link('depViz')}`);
  }

  const bundleMarkup = await discoverBundleArtifacts(hostUrl);

  contentRows.push(
    `bundle size: ${artifacts.link('bundleSizeStats')}`,
    `interaction-benchmark: ${artifacts.link('interactionStats')}`,
    `storybook: ${artifacts.link('storybook')}`,
    `typescript migration: ${artifacts.link('tsMigrationDashboard')}`,
    artifacts.link('allArtifacts'),
    `<details>
       <summary>bundle viz:</summary>
       ${bundleMarkup}
     </details>`,
  );

  const hiddenContent = `<ul>${contentRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;

  return `<details><summary>Builds ready [${shortSha}]</summary>${hiddenContent}</details>\n\n`;
}
