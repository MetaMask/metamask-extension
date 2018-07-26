const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const request = require('request-promise');
const VERSION = require('../dist/chrome/manifest.json').version;
const fs = require('fs');

start().catch(console.error);

async function start() {
  console.log('VERSION', VERSION)
  const CIRCLE_SHA1 = process.env.CIRCLE_SHA1
  console.log('CIRCLE_SHA1', CIRCLE_SHA1)
  const CIRCLE_ARTIFACTS = process.env.CIRCLE_ARTIFACTS
  console.log('CIRCLE_ARTIFACTS', CIRCLE_ARTIFACTS)
  const CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM
  console.log('CIRCLE_BUILD_NUM', CIRCLE_BUILD_NUM)
  let releaseId;

  const SHORT_SHA1 = CIRCLE_SHA1.slice(0, 7)
  const CREATE_RELEASE_URI = `https://api.github.com/repos/Natalya11444/metamask-extension/releases?tag_name=v` + VERSION
    + "&target_commitish=" + SHORT_SHA1 + "&name=v" + VERSION;
  console.log(`Posting to: ${CREATE_RELEASE_URI}`)

  const releaseBody = `
  <details>
    <summary>
      New release
    </summary>
  </details>
  `
  await request({
    method: 'POST',
    uri: CREATE_RELEASE_URI,
    body: releaseBody,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'Nifty Wallet'
    }
  }).then(async function (response) {
    releaseId = response.id
    console.log('releaseId: ' + releaseId);

    await uploadAsset(`./builds/metamask-chrome-${VERSION}.zip`, `metamask-chrome-${VERSION}.zip`, releaseId);
    await uploadAsset(`./builds/metamask-opera-${VERSION}.zip`, `metamask-opera-${VERSION}.zip`, releaseId);

  })
    .catch(function (err) {
      console.error('error in request:' + err);
    });
}

async function uploadAsset(path, name, releaseId) {
  const UPLOAD_ASSET_URL = `https://api.github.com/repos/Natalya11444/metamask-extension/releases/${releaseId}/assets?name=${name}`;
  console.log(`UPLOAD_ASSET_URL: ${UPLOAD_ASSET_URL}`);

  return request({
    method: 'POST',
    uri: UPLOAD_ASSET_URL,
    body: fs.readFileSync(path),
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/zip",
      'User-Agent': 'Nifty Wallet'
    }
  })

}
