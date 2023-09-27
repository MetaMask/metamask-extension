#!/usr/bin/env node

const { promises: fs } = require('fs');
const path = require('path');
// Fetch is part of node js in future versions, thus triggering no-shadow
// eslint-disable-next-line no-shadow
const fetch = require('node-fetch');
const glob = require('fast-glob');
const VERSION = require('../package.json').version;
const { getHighlights } = require('./highlights');

start().catch(console.error);

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getHumanReadableSize(bytes) {
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

function getPercentageChange(from, to) {
  return parseFloat(((to - from) / Math.abs(from)) * 100).toFixed(2);
}

async function start() {
  const {
    GITHUB_COMMENT_TOKEN,
    CIRCLE_PULL_REQUEST,
    CIRCLE_SHA1,
    CIRCLE_BUILD_NUM,
    CIRCLE_WORKFLOW_JOB_ID,
    PARENT_COMMIT,
  } = process.env;

  console.log('CIRCLE_PULL_REQUEST', CIRCLE_PULL_REQUEST);
  console.log('CIRCLE_SHA1', CIRCLE_SHA1);
  console.log('CIRCLE_BUILD_NUM', CIRCLE_BUILD_NUM);
  console.log('CIRCLE_WORKFLOW_JOB_ID', CIRCLE_WORKFLOW_JOB_ID);
  console.log('PARENT_COMMIT', PARENT_COMMIT);

  if (!CIRCLE_PULL_REQUEST) {
    console.warn(`No pull request detected for commit "${CIRCLE_SHA1}"`);
    return;
  }

  const CIRCLE_PR_NUMBER = CIRCLE_PULL_REQUEST.split('/').pop();
  const SHORT_SHA1 = CIRCLE_SHA1.slice(0, 7);
  const BUILD_LINK_BASE = `https://output.circle-artifacts.com/output/job/${CIRCLE_WORKFLOW_JOB_ID}/artifacts/0`;
  // build the github comment content

  // links to extension builds
  const platforms = ['chrome', 'firefox'];
  const buildLinks = platforms
    .map((platform) => {
      const url = `${BUILD_LINK_BASE}/builds/metamask-${platform}-${VERSION}.zip`;
      return `<a href="${url}">${platform}</a>`;
    })
    .join(', ');
  const betaBuildLinks = `<a href="${BUILD_LINK_BASE}/builds-beta/metamask-beta-chrome-${VERSION}.zip">chrome</a>`;
  const flaskBuildLinks = platforms
    .map((platform) => {
      const url = `${BUILD_LINK_BASE}/builds-flask/metamask-flask-${platform}-${VERSION}-flask.0.zip`;
      return `<a href="${url}">${platform}</a>`;
    })
    .join(', ');
  const mmiBuildLinks = platforms
    .map((platform) => {
      const url = `${BUILD_LINK_BASE}/builds-mmi/metamask-mmi-${platform}-${VERSION}-mmi.0.zip`;
      return `<a href="${url}">${platform}</a>`;
    })
    .join(', ');
  const testBuildLinks = platforms
    .map((platform) => {
      const url = `${BUILD_LINK_BASE}/builds-test/metamask-${platform}-${VERSION}.zip`;
      return `<a href="${url}">${platform}</a>`;
    })
    .join(', ');
  const testFlaskBuildLinks = platforms
    .map((platform) => {
      const url = `${BUILD_LINK_BASE}/builds-test-flask/metamask-flask-${platform}-${VERSION}-flask.0.zip`;
      return `<a href="${url}">${platform}</a>`;
    })
    .join(', ');

  // links to bundle browser builds
  const bundles = {};
  const fileType = '.html';
  const sourceMapRoot = '/build-artifacts/source-map-explorer/';
  const bundleFiles = await glob(`.${sourceMapRoot}*${fileType}`);

  bundleFiles.forEach((bundleFile) => {
    const fileName = bundleFile.split(sourceMapRoot)[1];
    const bundleName = fileName.split(fileType)[0];
    const url = `${BUILD_LINK_BASE}${sourceMapRoot}${fileName}`;
    let fileRoot = bundleName;
    let fileIndex = bundleName.match(/-[0-9]{1,}$/u)?.index;

    if (fileIndex) {
      fileRoot = bundleName.slice(0, fileIndex);
      fileIndex = bundleName.slice(fileIndex + 1, bundleName.length);
    }

    const link = `<a href="${url}">${fileIndex || fileRoot}</a>`;

    if (fileRoot in bundles) {
      bundles[fileRoot].push(link);
    } else {
      bundles[fileRoot] = [link];
    }
  });

  const bundleMarkup = `<ul>${Object.keys(bundles)
    .map((key) => `<li>${key}: ${bundles[key].join(', ')}</li>`)
    .join('')}</ul>`;

  const bundleSizeDataUrl =
    'https://raw.githubusercontent.com/MetaMask/extension_bundlesize_stats/main/stats/bundle_size_data.json';

  const coverageUrl = `${BUILD_LINK_BASE}/coverage/index.html`;
  const coverageLink = `<a href="${coverageUrl}">Report</a>`;

  const storybookUrl = `${BUILD_LINK_BASE}/storybook/index.html`;
  const storybookLink = `<a href="${storybookUrl}">Storybook</a>`;

  const tsMigrationDashboardUrl = `${BUILD_LINK_BASE}/ts-migration-dashboard/index.html`;
  const tsMigrationDashboardLink = `<a href="${tsMigrationDashboardUrl}">Dashboard</a>`;

  // links to bundle browser builds
  const depVizUrl = `${BUILD_LINK_BASE}/build-artifacts/build-viz/index.html`;
  const depVizLink = `<a href="${depVizUrl}">Build System</a>`;
  const moduleInitStatsBackgroundUrl = `${BUILD_LINK_BASE}/test-artifacts/chrome/mv3/initialisation/background/index.html`;
  const moduleInitStatsBackgroundLink = `<a href="${moduleInitStatsBackgroundUrl}">Background Module Init Stats</a>`;
  const moduleInitStatsUIUrl = `${BUILD_LINK_BASE}/test-artifacts/chrome/mv3/initialisation/ui/index.html`;
  const moduleInitStatsUILink = `<a href="${moduleInitStatsUIUrl}">UI Init Stats</a>`;
  const moduleLoadStatsUrl = `${BUILD_LINK_BASE}/test-artifacts/chrome/mv3/load_time/index.html`;
  const moduleLoadStatsLink = `<a href="${moduleLoadStatsUrl}">Module Load Stats</a>`;
  const bundleSizeStatsUrl = `${BUILD_LINK_BASE}/test-artifacts/chrome/mv3/bundle_size.json`;
  const bundleSizeStatsLink = `<a href="${bundleSizeStatsUrl}">Bundle Size Stats</a>`;
  const userActionsStatsUrl = `${BUILD_LINK_BASE}/test-artifacts/chrome/benchmark/user_actions.json`;
  const userActionsStatsLink = `<a href="${userActionsStatsUrl}">E2e Actions Stats</a>`;

  // link to artifacts
  const allArtifactsUrl = `https://circleci.com/gh/MetaMask/metamask-extension/${CIRCLE_BUILD_NUM}#artifacts/containers/0`;

  const contentRows = [
    `builds: ${buildLinks}`,
    `builds (beta): ${betaBuildLinks}`,
    `builds (flask): ${flaskBuildLinks}`,
    `builds (MMI): ${mmiBuildLinks}`,
    `builds (test): ${testBuildLinks}`,
    `builds (test-flask): ${testFlaskBuildLinks}`,
    `build viz: ${depVizLink}`,
    `mv3: ${moduleInitStatsBackgroundLink}`,
    `mv3: ${moduleInitStatsUILink}`,
    `mv3: ${moduleLoadStatsLink}`,
    `mv3: ${bundleSizeStatsLink}`,
    `mv2: ${userActionsStatsLink}`,
    `code coverage: ${coverageLink}`,
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

  const benchmarkResults = {};
  for (const platform of platforms) {
    const benchmarkPath = path.resolve(
      __dirname,
      '..',
      path.join('test-artifacts', platform, 'benchmark', 'pageload.json'),
    );
    try {
      const data = await fs.readFile(benchmarkPath, 'utf8');
      const benchmark = JSON.parse(data);
      benchmarkResults[platform] = benchmark;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No benchmark data found for ${platform}; skipping`);
      } else {
        console.error(
          `Error encountered processing benchmark data for '${platform}': '${error}'`,
        );
      }
    }
  }

  const summaryPlatform = 'chrome';
  const summaryPage = 'home';
  let commentBody = artifactsBody;
  if (benchmarkResults[summaryPlatform]) {
    try {
      const summaryPageLoad = Math.round(
        parseFloat(benchmarkResults[summaryPlatform][summaryPage].average.load),
      );
      const summaryPageLoadMarginOfError = Math.round(
        parseFloat(
          benchmarkResults[summaryPlatform][summaryPage].marginOfError.load,
        ),
      );
      const benchmarkSummary = `Page Load Metrics (${summaryPageLoad} ± ${summaryPageLoadMarginOfError} ms)`;

      const allPlatforms = new Set();
      const allPages = new Set();
      const allMetrics = new Set();
      const allMeasures = new Set();
      for (const platform of Object.keys(benchmarkResults)) {
        allPlatforms.add(platform);
        const platformBenchmark = benchmarkResults[platform];
        const pages = Object.keys(platformBenchmark);
        for (const page of pages) {
          allPages.add(page);
          const pageBenchmark = platformBenchmark[page];
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

      const tableRows = [];
      for (const platform of allPlatforms) {
        const pageRows = [];
        for (const page of allPages) {
          const metricRows = [];
          for (const metric of allMetrics) {
            let metricData = `<td>${metric}</td>`;
            for (const measure of allMeasures) {
              metricData += `<td align="right">${Math.round(
                parseFloat(benchmarkResults[platform][page][measure][metric]),
              )}</td>`;
            }
            metricRows.push(metricData);
          }
          metricRows[0] = `<td rowspan="${
            allMetrics.size
          }">${capitalizeFirstLetter(page)}</td>${metricRows[0]}`;
          pageRows.push(...metricRows);
        }
        pageRows[0] = `<td rowspan="${
          allPages.size * allMetrics.size
        }">${capitalizeFirstLetter(platform)}</td>${pageRows[0]}`;
        for (const row of pageRows) {
          tableRows.push(`<tr>${row}</tr>`);
        }
      }

      const benchmarkTableHeaders = ['Platform', 'Page', 'Metric'];
      for (const measure of allMeasures) {
        benchmarkTableHeaders.push(`${capitalizeFirstLetter(measure)} (ms)`);
      }
      const benchmarkTableHeader = `<thead><tr>${benchmarkTableHeaders
        .map((header) => `<th>${header}</th>`)
        .join('')}</tr></thead>`;
      const benchmarkTableBody = `<tbody>${tableRows.join('')}</tbody>`;
      const benchmarkTable = `<table>${benchmarkTableHeader}${benchmarkTableBody}</table>`;
      const benchmarkBody = `<details><summary>${benchmarkSummary}</summary>${benchmarkTable}</details>\n\n`;
      commentBody += `${benchmarkBody}`;
    } catch (error) {
      console.error(`Error constructing benchmark results: '${error}'`);
    }
  } else {
    console.log(`No results for ${summaryPlatform} found; skipping benchmark`);
  }

  try {
    const prBundleSizeStats = JSON.parse(
      await fs.readFile(
        path.resolve(
          __dirname,
          '..',
          path.join('test-artifacts', 'chrome', 'mv3', 'bundle_size.json'),
        ),
        'utf-8',
      ),
    );

    const devBundleSizeStats = await (
      await fetch(bundleSizeDataUrl, {
        method: 'GET',
      })
    ).json();

    const prSizes = {
      background: prBundleSizeStats.background.size,
      ui: prBundleSizeStats.ui.size,
      common: prBundleSizeStats.common.size,
    };

    const devSizes = Object.keys(prSizes).reduce((sizes, part) => {
      sizes[part] = devBundleSizeStats[PARENT_COMMIT][part] || 0;
      return sizes;
    }, {});

    const diffs = Object.keys(prSizes).reduce((output, part) => {
      output[part] = prSizes[part] - devSizes[part];
      return output;
    }, {});

    const sizeDiffRows = Object.keys(diffs).map(
      (part) =>
        `${part}: ${getHumanReadableSize(diffs[part])} (${getPercentageChange(
          devSizes[part],
          prSizes[part],
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

  try {
    const highlights = await getHighlights({ artifactBase: BUILD_LINK_BASE });
    if (highlights) {
      const highlightsBody = `### highlights:\n${highlights}\n`;
      commentBody += highlightsBody;
    }
  } catch (error) {
    console.error(`Error constructing highlight results: '${error}'`);
  }

  const JSON_PAYLOAD = JSON.stringify({ body: commentBody });
  const POST_COMMENT_URI = `https://api.github.com/repos/metamask/metamask-extension/issues/${CIRCLE_PR_NUMBER}/comments`;
  console.log(`Announcement:\n${commentBody}`);
  console.log(`Posting to: ${POST_COMMENT_URI}`);

  const response = await fetch(POST_COMMENT_URI, {
    method: 'POST',
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      Authorization: `token ${GITHUB_COMMENT_TOKEN}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Post comment failed with status '${response.statusText}'`);
  }
}
