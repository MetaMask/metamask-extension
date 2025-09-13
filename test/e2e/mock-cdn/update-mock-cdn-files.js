const util = require('util');
const { writeFileSync } = require('fs');

const execFile = util.promisify(require('node:child_process').execFile);

const PPOM_VERSION_URL =
  'https://static.cx.metamask.io/api/v1/confirmations/ppom/ppom_version.json';
const PPOM_CONFIG_URL =
  'https://static.cx.metamask.io/api/v1/confirmations/ppom/config/0x1/';
const PPOM_STALE_URL =
  'https://static.cx.metamask.io/api/v1/confirmations/ppom/stale/0x1/';
const PPOM_STALE_DIFF_URL =
  'https://static.cx.metamask.io/api/v1/confirmations/ppom/stale_diff/0x1/';
const MOCK_CDN_FOLDER_URL = 'test/e2e/mock-cdn/';

const CDN_CONFIG_PATH = 'test/e2e/mock-cdn/cdn-config.txt';
const CDN_STALE_DIFF_PATH = 'test/e2e/mock-cdn/cdn-stale-diff.txt';
const CDN_STALE_PATH = 'test/e2e/mock-cdn/cdn-stale.txt';

async function getFileVersions() {
  let ppomVersionData;

  ppomVersionData = await fetch(PPOM_VERSION_URL, {
    method: 'GET',
  });

  const ppomVersionDataHeaders = ppomVersionData.headers;
  ppomVersionData = await ppomVersionData.json();

  const etagVersion = ppomVersionDataHeaders.get('etag');
  const etagVersionObject = { Etag: etagVersion };

  // updating ppom-version-headers.json file
  writeFileSync(
    `${MOCK_CDN_FOLDER_URL}ppom-version-headers.json`,
    JSON.stringify(etagVersionObject, null, 2),
  );

  // updating ppom-version.json file
  writeFileSync(
    `${MOCK_CDN_FOLDER_URL}ppom-version.json`,
    JSON.stringify(ppomVersionData, null, 2),
  );

  const mainnetConfigVersion = ppomVersionData.find(
    (item) => item.name === 'config' && item.chainId === '0x1',
  ).version;

  const mainnetStaleVersion = ppomVersionData.find(
    (item) => item.name === 'stale' && item.chainId === '0x1',
  ).version;

  const mainnetStaleDiffVersion = ppomVersionData.find(
    (item) => item.name === 'stale_diff' && item.chainId === '0x1',
  ).version;

  return {
    mainnetConfigVersion,
    mainnetStaleVersion,
    mainnetStaleDiffVersion,
  };
}

async function updateMockCdnFiles() {
  const { mainnetConfigVersion, mainnetStaleVersion, mainnetStaleDiffVersion } =
    await getFileVersions();

  // Function to create header object with Etag and Content-Type
  const createHeaderObject = (etag) => ({
    Etag: etag,
    'Content-Type': 'text/plain',
  });
  // updating cdn-config-res-headers.json file
  const configResponse = await fetch(
    `${PPOM_CONFIG_URL}${mainnetConfigVersion}`,
    {
      method: 'GET',
    },
  );

  const configHeaders = configResponse.headers;

  const etagConfig = configHeaders.get('etag');
  const etagConfigObject = createHeaderObject(etagConfig);

  writeFileSync(
    `${MOCK_CDN_FOLDER_URL}cdn-config-res-headers.json`,
    JSON.stringify(etagConfigObject, null, 2),
  );

  // updating cdn-stale-res-headers.json file
  const staleResponse = await fetch(`${PPOM_STALE_URL}${mainnetStaleVersion}`, {
    method: 'GET',
  });

  const staleHeaders = staleResponse.headers;

  const etagStale = staleHeaders.get('etag');
  const etagStaleObject = createHeaderObject(etagStale);

  writeFileSync(
    `${MOCK_CDN_FOLDER_URL}cdn-stale-res-headers.json`,
    JSON.stringify(etagStaleObject, null, 2),
  );

  // updating cdn-stale-diff-res-headers.json file
  const staleDiffResponse = await fetch(
    `${PPOM_STALE_DIFF_URL}${mainnetStaleDiffVersion}`,
    {
      method: 'GET',
    },
  );

  const staleDiffHeaders = staleDiffResponse.headers;

  const etagStaleDiff = staleDiffHeaders.get('etag');
  const etagStaleDiffObject = createHeaderObject(etagStaleDiff);

  writeFileSync(
    `${MOCK_CDN_FOLDER_URL}cdn-stale-diff-res-headers.json`,
    JSON.stringify(etagStaleDiffObject, null, 2),
  );

  // exporting the brotli data to files
  await execFile('curl', [ `${PPOM_CONFIG_URL}${mainnetConfigVersion}`, '-o', CDN_CONFIG_PATH ]);
  await execFile('curl', [ `${PPOM_STALE_URL}${mainnetStaleVersion}`, '-o', CDN_STALE_PATH ]);
  await execFile('curl', [ `${PPOM_STALE_DIFF_URL}${mainnetStaleDiffVersion}`, '-o', CDN_STALE_DIFF_PATH ]);
}

updateMockCdnFiles();
