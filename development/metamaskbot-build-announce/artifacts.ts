/**
 * Artifact link construction and PR "Builds ready" section builder.
 */

import {
  BENCHMARK_BUILD_TYPES,
  BENCHMARK_PLATFORMS,
} from '../../shared/constants/benchmarks';
import {
  BUNDLE_SIZE_DEBUG_FILE,
  BUNDLE_SIZE_SUMMARY_FILE,
} from '../webpack/utils/plugins/ManifestPlugin/stats';
import { getBuildLinks, type BuildLinks } from './build-links';

export {
  getBuildLinks,
  type BuildBrowser,
  type BuildLinks,
  type BuildType,
} from './build-links';

type ArtifactLink = { url: string; label: string };

type ArtifactLinkMap = {
  bundleSizeData: ArtifactLink;
  bundleSizeDebug: ArtifactLink;
  bundleSizeStats: ArtifactLink;
  bundleAnalyzer: ArtifactLink;
  interactionStats: ArtifactLink;
  storybook: ArtifactLink;
  tsMigrationDashboard: ArtifactLink;
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
    bundleSizeDebug: {
      url: `${hostUrl}/${BUNDLE_SIZE_DEBUG_FILE.replaceAll(
        '[browser]',
        'chrome',
      )}`,
      label: 'Bundle Size Stats',
    },
    bundleSizeStats: {
      url: `${hostUrl}/${BUNDLE_SIZE_SUMMARY_FILE.replaceAll(
        '[browser]',
        'chrome',
      )}`,
      label: 'Bundle Size Stats',
    },
    bundleAnalyzer: {
      url: `${hostUrl}/build-dist-webpack/bundle-analyzer/report.html`,
      label: 'Bundle Analyzer',
    },
    interactionStats: {
      url: `${hostUrl}/benchmarks/benchmark-${BENCHMARK_PLATFORMS.CHROME}-${BENCHMARK_BUILD_TYPES.WEBPACK}-interactionUserActions.json`,
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
    allArtifacts: {
      url: `https://github.com/${owner}/${repository}/actions/runs/${runId}#artifacts`,
      label: 'all artifacts',
    },
  };

  const link = (key: keyof ArtifactLinkMap) =>
    `<a href="${ARTIFACT_LINK_MAP[key].url}">${ARTIFACT_LINK_MAP[key].label}</a>`;

  return { ...ARTIFACT_LINK_MAP, link };
}

/**
 * Renders build links as HTML content rows (e.g. "builds: chrome, firefox").
 *
 * @param buildLinks - BuildLinks from getBuildLinks.
 * @returns Array of HTML strings, one per bundler/build type combination.
 */
function formatBuildLinks(buildLinks: BuildLinks): string[] {
  return Object.entries(buildLinks).flatMap(([bundler, types]) => {
    const prefix = `${bundler[0].toUpperCase()}${bundler.slice(1)} builds`;
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

/**
 * Builds the collapsible "Builds ready" artifacts body for the PR comment.
 *
 * @param options - Configuration for the artifacts body.
 * @param options.hostUrl - Base URL for hosted artifacts.
 * @param options.version - The extension version string (from package.json).
 * @param options.shortSha - Abbreviated commit hash.
 * @param options.artifacts - Artifact links from getArtifactLinks.
 * @param options.buildsFromSha - The short SHA of the commit that produced the builds (differs from shortSha when builds are reused).
 * @returns Collapsible HTML string.
 */
export function buildArtifactsBody({
  hostUrl,
  version,
  shortSha,
  artifacts,
  buildsFromSha,
}: {
  hostUrl: string;
  version: string;
  shortSha: string;
  artifacts: ArtifactLinks;
  buildsFromSha: string;
}) {
  const contentRows: string[] = [];

  const buildLinks = getBuildLinks({ hostUrl, version });
  contentRows.push(...formatBuildLinks(buildLinks));

  contentRows.push(
    `bundle size: ${artifacts.link('bundleSizeDebug')}`,
    `bundle analyzer: ${artifacts.link('bundleAnalyzer')}`,
    `interaction-benchmark: ${artifacts.link('interactionStats')}`,
    `storybook: ${artifacts.link('storybook')}`,
    `typescript migration: ${artifacts.link('tsMigrationDashboard')}`,
    artifacts.link('allArtifacts'),
  );

  const isReused = buildsFromSha !== shortSha;
  const reusedTag = isReused ? ` [reused from ${buildsFromSha}]` : '';

  const warningItem =
    `<li>⚠️ Make sure the build is safe before downloading and running this build.` +
    `<ul><li>Please do not use these builds with accounts that contain significant real money.</li>\n` +
    `<li>Beware the security risks of <a href="https://adnanthekhan.com/2024/05/06/the-monsters-in-your-build-cache-github-actions-cache-poisoning/">cache poisoning</a>.</li></ul></li>`;

  const hiddenContent = `<ul>${warningItem}\n${contentRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;

  return `<details><summary>Builds ready [${shortSha}]${reusedTag}</summary>${hiddenContent}</details>\n\n`;
}
