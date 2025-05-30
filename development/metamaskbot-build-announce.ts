import startCase from 'lodash/startCase';
import { version as VERSION } from '../package.json';

start().catch(console.error);

const benchmarkPlatforms = ['chrome', 'firefox'];
const buildTypes = ['browserify', 'webpack'];

type BenchmarkResults = Record<
  (typeof benchmarkPlatforms)[number],
  Record<
    (typeof buildTypes)[number],
    Record<string, Record<string, Record<string, string>>>
  >
>;

function getHumanReadableSize(bytes: number): string {
  if (!bytes) {
    return '0 Bytes';
  }

  const absBytes = Math.abs(bytes);
  const kibibyteSize = 1024;
  const magnitudes = ['Bytes', 'KiB', 'MiB'];
  let magnitudeIndex = 0;
  if (absBytes > Math.pow(kibibyteSize, 2)) {
    magnitudeIndex = 2;
  } else if (absBytes > kibibyteSize) {
    magnitudeIndex = 1;
  }
  return `${parseFloat(
    (bytes / Math.pow(kibibyteSize, magnitudeIndex)).toFixed(2),
  )} ${magnitudes[magnitudeIndex]}`;
}

function getPercentageChange(from: number, to: number): number {
  return parseFloat((((to - from) / Math.abs(from)) * 100).toFixed(2));
}

/**
 * Check whether an artifact exists,
 *
 * @param url - The URL of the artifact to check.
 * @returns True if the artifact exists, false if it doesn't
 */
async function artifactExists(url: string): Promise<boolean> {
  const response = await fetch(url, { method: 'HEAD' });
  return response.ok;
}

async function start(): Promise<void> {
  const {
    PR_COMMENT_TOKEN,
    OWNER,
    REPOSITORY,
    RUN_ID,
    PR_NUMBER,
    HEAD_COMMIT_HASH,
    MERGE_BASE_COMMIT_HASH,
    HOST_URL,
  } = process.env as Record<string, string>;

  if (!PR_NUMBER) {
    console.warn(`No pull request detected for commit "${HEAD_COMMIT_HASH}"`);
    return;
  }

  const SHORT_SHA1 = HEAD_COMMIT_HASH.slice(0, 7);

  type BuildType = {
    chrome?: string;
    firefox?: string;
  };

  // links to extension builds
  const buildMap: Record<string, BuildType> = {
    builds: {
      chrome: `${HOST_URL}/build-dist-browserify/builds/metamask-chrome-${VERSION}.zip`,
      firefox: `${HOST_URL}/build-dist-mv2-browserify/builds/metamask-firefox-${VERSION}.zip`,
    },
    'builds (beta)': {
      chrome: `${HOST_URL}/build-beta-browserify/builds/metamask-beta-chrome-${VERSION}-beta.0.zip`,
      firefox: `${HOST_URL}/build-beta-mv2-browserify/builds/metamask-beta-firefox-${VERSION}-beta.0.zip`,
    },
    'builds (flask)': {
      chrome: `${HOST_URL}/build-flask-browserify/builds/metamask-flask-chrome-${VERSION}-flask.0.zip`,
      firefox: `${HOST_URL}/build-flask-mv2-browserify/builds/metamask-flask-firefox-${VERSION}-flask.0.zip`,
    },
    'builds (test)': {
      chrome: `${HOST_URL}/build-test-browserify/builds/metamask-chrome-${VERSION}.zip`,
      firefox: `${HOST_URL}/build-test-mv2-browserify/builds/metamask-firefox-${VERSION}.zip`,
    },
    'builds (test-flask)': {
      chrome: `${HOST_URL}/build-test-flask-browserify/builds/metamask-flask-chrome-${VERSION}-flask.0.zip`,
      firefox: `${HOST_URL}/build-test-flask-mv2-browserify/builds/metamask-flask-firefox-${VERSION}-flask.0.zip`,
    },
  };

  const buildContentRows = Object.entries(buildMap).map(([label, builds]) => {
    const buildLinks = Object.entries(builds).map(([platform, url]) => {
      return `<a href="${url}">${platform}</a>`;
    });
    return `${label}: ${buildLinks.join(', ')}`;
  });

  // links to bundle browser builds
  const bundles: Record<string, string[]> = {};
  const fileRoots = [
    'background',
    'common',
    'ui',
    'content-script',
    'offscreen',
  ];

  for (const fileRoot of fileRoots) {
    bundles[fileRoot] = [];
    let fileIndex = 0;
    let url = `${HOST_URL}/source-map-explorer/${fileRoot}-${fileIndex}.html`;
    console.log(`Verifying ${url}`);
    while (await artifactExists(url)) {
      const link = `<a href="${url}">${fileIndex}</a>`;
      bundles[fileRoot].push(link);

      fileIndex += 1;
      url = `${HOST_URL}/source-map-explorer/${fileRoot}-${fileIndex}.html`;
      console.log(`Verifying ${url}`);
    }
    console.log(`Not found: ${url}`);
  }

  const bundleMarkup = `<ul>${Object.keys(bundles)
    .map((key) => `<li>${key}: ${bundles[key].join(', ')}</li>`)
    .join('')}</ul>`;

  const bundleSizeDataUrl =
    'https://raw.githubusercontent.com/MetaMask/extension_bundlesize_stats/main/stats/bundle_size_data.json';

  const storybookUrl = `${HOST_URL}/storybook-build/index.html`;
  const storybookLink = `<a href="${storybookUrl}">Storybook</a>`;

  const tsMigrationDashboardUrl = `${HOST_URL}/ts-migration-dashboard/index.html`;
  const tsMigrationDashboardLink = `<a href="${tsMigrationDashboardUrl}">Dashboard</a>`;

  const depVizUrl = `${HOST_URL}/lavamoat-viz/index.html`;
  const depVizLink = `<a href="${depVizUrl}">Build System</a>`;

  const bundleSizeStatsUrl = `${HOST_URL}/bundle-size/bundle_size.json`;
  const bundleSizeStatsLink = `<a href="${bundleSizeStatsUrl}">Bundle Size Stats</a>`;

  const userActionsStatsUrl = `${HOST_URL}/benchmarks/benchmark-chrome-browserify-userActions.json`;
  const userActionsStatsLink = `<a href="${userActionsStatsUrl}">User Actions Stats</a>`;

  const allArtifactsUrl = `https://github.com/${OWNER}/${REPOSITORY}/actions/runs/${RUN_ID}#artifacts`;

  const contentRows = [
    ...buildContentRows,
    `build viz: ${depVizLink}`,
    `bundle size: ${bundleSizeStatsLink}`,
    `user-actions-benchmark: ${userActionsStatsLink}`,
    `storybook: ${storybookLink}`,
    `typescript migration: ${tsMigrationDashboardLink}`,
    `<a href="${allArtifactsUrl}">all artifacts</a>`,
    `<details>
       <summary>bundle viz:</summary>
       ${bundleMarkup}
     </details>`,
  ];
  const hiddenContent = `<ul>${contentRows
    .map((row) => `<li>${row}</li>`)
    .join('\n')}</ul>`;
  const exposedContent = `Builds ready [${SHORT_SHA1}]`;
  const artifactsBody = `<details><summary>${exposedContent}</summary>${hiddenContent}</details>\n\n`;

  const benchmarkResults: BenchmarkResults = {};
  for (const platform of benchmarkPlatforms) {
    benchmarkResults[platform] = {};
    for (const buildType of buildTypes) {
      const benchmarkUrl = `${HOST_URL}/benchmarks/benchmark-${platform}-${buildType}-pageload.json`;
      try {
        const benchmarkResponse = await fetch(benchmarkUrl);
        if (!benchmarkResponse.ok) {
          throw new Error(
            `Failed to fetch benchmark data, status ${benchmarkResponse.statusText}`,
          );
        }
        const benchmark = await benchmarkResponse.json();
        benchmarkResults[platform][buildType] = benchmark;
      } catch (error) {
        console.error(
          `Error encountered processing benchmark data for '${platform}': '${error}'`,
        );
      }
    }
  }

  const summaryPlatform = benchmarkPlatforms[0];
  const summaryBuildType = buildTypes[0];
  const summaryPage = 'home';
  let commentBody = artifactsBody;
  if (benchmarkResults[summaryPlatform][summaryBuildType]) {
    try {
      const summaryPageStartup = Math.round(
        parseFloat(
          benchmarkResults[summaryPlatform][summaryBuildType][summaryPage].mean
            .uiStartup,
        ),
      );
      const summaryPageStartupStandardDeviation = Math.round(
        parseFloat(
          benchmarkResults[summaryPlatform][summaryBuildType][summaryPage]
            .stdDev.uiStartup,
        ),
      );
      const benchmarkSummary = `UI Startup Metrics (${summaryPageStartup} ± ${summaryPageStartupStandardDeviation} ms)`;

      const allPlatforms = new Set<string>();
      const allBuildTypes = new Set<string>();
      const allPages = new Set<string>();
      const allMetrics = new Set<string>();
      const allMeasures = new Set<string>();
      for (const platform of Object.keys(benchmarkResults)) {
        allPlatforms.add(platform);
        const platformBenchmark = benchmarkResults[platform];
        const buildTypesInPlatform = Object.keys(platformBenchmark);
        for (const buildType of buildTypesInPlatform) {
          allBuildTypes.add(buildType);
          const buildBenchmark = platformBenchmark[buildType];
          const pages = Object.keys(buildBenchmark);
          for (const page of pages) {
            allPages.add(page);
            const pageBenchmark = buildBenchmark[page];
            const measures = Object.keys(pageBenchmark);
            for (const measure of measures) {
              allMeasures.add(measure);
              const measureBenchmark = pageBenchmark[measure];
              const metrics = Object.keys(measureBenchmark);
              for (const metric of metrics) {
                allMetrics.add(metric);
              }
            }
          }
        }
      }

      const tableRows: string[] = [];
      for (const platform of allPlatforms) {
        const pageRows: string[] = [];

        // We don't want to use allBuildTypes here because we might skip certain builds in the future
        const buildTypesInPlatform = Object.keys(benchmarkResults[platform]);
        for (const buildType of buildTypesInPlatform) {
          for (const page of allPages) {
            const metricRows: string[] = [];
            for (const metric of allMetrics) {
              let metricData = `<td>${metric}</td>`;
              for (const measure of allMeasures) {
                metricData += `<td align="right">${Math.round(
                  parseFloat(
                    benchmarkResults[platform][buildType][page][measure][
                      metric
                    ],
                  ),
                )}</td>`;
              }
              metricRows.push(metricData);
            }
            metricRows[0] = `<td rowspan="${allMetrics.size}">${startCase(
              buildType,
            )}</td><td rowspan="${allMetrics.size}">${startCase(page)}</td>${
              metricRows[0]
            }`;
            pageRows.push(...metricRows);
          }
        }
        pageRows[0] = `<td rowspan="${
          allPages.size * allBuildTypes.size * allMetrics.size
        }">${startCase(platform)}</td>${pageRows[0]}`;
        for (const row of pageRows) {
          tableRows.push(`<tr>${row}</tr>`);
        }
      }

      const benchmarkTableHeaders = ['Platform', 'BuildType', 'Page', 'Metric'];
      for (const measure of allMeasures) {
        benchmarkTableHeaders.push(`${startCase(measure)} (ms)`);
      }
      const benchmarkTableHeader = `<thead><tr>${benchmarkTableHeaders
        .map((header) => `<th>${header}</th>`)
        .join('')}</tr></thead>`;
      const benchmarkTableBody = `<tbody>${tableRows.join('')}</tbody>`;
      const benchmarkTable = `<table>${benchmarkTableHeader}${benchmarkTableBody}</table>`;
      const benchmarkWarnings = await runBenchmarkGate(benchmarkResults);
      const benchmarkBody = `<details><summary>${benchmarkSummary}</summary>${benchmarkTable}${benchmarkWarnings}</details>\n\n`;

      commentBody += `${benchmarkBody}`;
    } catch (error) {
      console.error(`Error constructing benchmark results: '${error}'`);
    }
  } else {
    console.log(`No results for ${summaryPlatform} found; skipping benchmark`);
  }

  try {
    const prBundleSizeStatsResponse = await fetch(bundleSizeStatsUrl);
    if (!prBundleSizeStatsResponse.ok) {
      throw new Error(
        `Failed to fetch prBundleSizeStats, status ${prBundleSizeStatsResponse.statusText}`,
      );
    }
    const prBundleSizeStats = await prBundleSizeStatsResponse.json();

    const devBundleSizeStatsResponse = await fetch(bundleSizeDataUrl);
    if (!devBundleSizeStatsResponse.ok) {
      throw new Error(
        `Failed to fetch devBundleSizeStats, status ${devBundleSizeStatsResponse.statusText}`,
      );
    }
    const devBundleSizeStats = await devBundleSizeStatsResponse.json();

    const prSizes = {
      background: prBundleSizeStats.background.size,
      ui: prBundleSizeStats.ui.size,
      common: prBundleSizeStats.common.size,
    };

    const devSizes = Object.keys(prSizes).reduce((sizes, part) => {
      sizes[part as keyof typeof prSizes] =
        devBundleSizeStats[MERGE_BASE_COMMIT_HASH][part] || 0;
      return sizes;
    }, {} as Record<keyof typeof prSizes, number>);

    const diffs = Object.keys(prSizes).reduce((output, part) => {
      output[part] =
        prSizes[part as keyof typeof prSizes] -
        devSizes[part as keyof typeof prSizes];
      return output;
    }, {} as Record<string, number>);

    const sizeDiffRows = Object.keys(diffs).map(
      (part) =>
        `${part}: ${getHumanReadableSize(diffs[part])} (${getPercentageChange(
          devSizes[part as keyof typeof prSizes],
          prSizes[part as keyof typeof prSizes],
        )}%)`,
    );

    const sizeDiffHiddenContent = `<ul>${sizeDiffRows
      .map((row) => `<li>${row}</li>`)
      .join('\n')}</ul>`;

    const sizeDiff = diffs.background + diffs.common;

    const sizeDiffWarning =
      sizeDiff > 0
        ? `🚨 Warning! Bundle size has increased!`
        : `🚀 Bundle size reduced!`;

    const sizeDiffExposedContent =
      sizeDiff === 0
        ? `Bundle size diffs`
        : `Bundle size diffs [${sizeDiffWarning}]`;

    const sizeDiffBody = `<details><summary>${sizeDiffExposedContent}</summary>${sizeDiffHiddenContent}</details>\n\n`;

    commentBody += sizeDiffBody;
  } catch (error) {
    console.error(`Error constructing bundle size diffs results: '${error}'`);
  }

  const JSON_PAYLOAD = JSON.stringify({ body: commentBody });
  const POST_COMMENT_URI = `https://api.github.com/repos/metamask/metamask-extension/issues/${PR_NUMBER}/comments`;
  console.log(`Announcement:\n${commentBody}`);

  if (PR_COMMENT_TOKEN) {
    console.log(`Posting to: ${POST_COMMENT_URI}`);

    const response = await fetch(POST_COMMENT_URI, {
      method: 'POST',
      body: JSON_PAYLOAD,
      headers: {
        'User-Agent': 'metamaskbot',
        Authorization: `token ${PR_COMMENT_TOKEN}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Post comment failed with status '${response.statusText}'`,
      );
    }
  }
}

async function runBenchmarkGate(
  benchmarkResults: BenchmarkResults,
): Promise<string> {
  const benchmarkGateUrl = `${process.env.CLOUDFRONT_REPO_URL}/benchmark-gate/benchmark-gate.json`;
  const exceededSums = { mean: 0, p95: 0 };
  let benchmarkGateBody = '';

  console.log(`Fetching benchmark gate from ${benchmarkGateUrl}`);
  try {
    const benchmarkResponse = await fetch(benchmarkGateUrl);
    if (!benchmarkResponse.ok) {
      throw new Error(
        `Failed to fetch benchmark gate data, status ${benchmarkResponse.statusText}`,
      );
    }

    const { gates, pingThresholds } = await benchmarkResponse.json();

    // Compare benchmarkResults with benchmark-gate.json
    for (const platform of Object.keys(gates)) {
      for (const buildType of Object.keys(gates[platform])) {
        for (const page of Object.keys(gates[platform][buildType])) {
          for (const measure of Object.keys(gates[platform][buildType][page])) {
            for (const metric of Object.keys(
              gates[platform][buildType][page][measure],
            )) {
              const benchmarkValue =
                benchmarkResults[platform][buildType][page][measure][metric];

              const gateValue =
                gates[platform][buildType][page][measure][metric];

              if (benchmarkValue > gateValue) {
                const ceiledValue = Math.ceil(parseFloat(benchmarkValue));

                if (measure === 'mean') {
                  exceededSums.mean += ceiledValue - gateValue;
                } else if (measure === 'p95') {
                  exceededSums.p95 += ceiledValue - gateValue;
                }

                benchmarkGateBody += `Benchmark value ${ceiledValue} exceeds gate value ${gateValue} for ${platform} ${buildType} ${page} ${measure} ${metric}<br>\n`;
              }
            }
          }
        }
      }
    }

    if (benchmarkGateBody) {
      benchmarkGateBody += `<b>Sum of mean exceeds: ${
        exceededSums.mean
      }ms | Sum of p95 exceeds: ${
        exceededSums.p95
      }ms<br>\nSum of all benchmark exceeds: ${
        exceededSums.mean + exceededSums.p95
      }ms</b><br>\n`;

      if (
        exceededSums.mean > pingThresholds.mean ||
        exceededSums.p95 > pingThresholds.p95 ||
        exceededSums.mean + exceededSums.p95 >
          pingThresholds.mean + pingThresholds.p95
      ) {
        // Soft gate, just pings @HowardBraham
        benchmarkGateBody = `cc: @HowardBraham<br>\n${benchmarkGateBody}`;
      }
    }
  } catch (error) {
    console.error(`Error encountered fetching benchmark gate data: '${error}'`);
  }

  return benchmarkGateBody;
}
