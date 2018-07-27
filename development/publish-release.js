const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const request = require('request-promise');
const VERSION = require('../dist/chrome/manifest.json').version;
const fs = require('fs');

start().catch(console.error);

async function start() {
  console.log('VERSION', VERSION)
  const CIRCLE_SHA1 = process.env.CIRCLE_SHA1
  let releaseId;
  const SHORT_SHA1 = CIRCLE_SHA1.slice(0, 7)
  const CREATE_RELEASE_URI = `https://api.github.com/repos/Natalya11444/metamask-extension/releases`;
  console.log(`CREATE_RELEASE_URI: ${CREATE_RELEASE_URI}`)

  const releaseBody = `
  <details>
    <summary>
      New release
    </summary>
  </details>
  `;

  request({
    method: 'POST',
    uri: CREATE_RELEASE_URI,
    headers: {
      'User-Agent': 'Nifty Wallet',
      'Authorization': `token ${GITHUB_TOKEN}`
    },
    body: JSON.stringify({body: releaseBody, tag_name: `v${VERSION}`})
  }).then(async function (response) {
    console.log('response: ' + response);
    releaseId = JSON.parse(response).id;
    console.log(`releaseId: ${releaseId}`);

    return uploadAsset(`./builds/metamask-edge-4.8.0.zip`, `metamask-edge-4.8.0.zip`, releaseId)
      .then(() => {
        return uploadAsset(`./builds/metamask-firefox-4.8.0.zip`, `metamask-firefox-4.8.0.zip`, releaseId)
      })
      .then(() => {
          return uploadAsset(`./builds/metamask-opera-4.8.0.zip`, `metamask-opera-4.8.0.zip`, releaseId)
        }
      )
  }).catch(function (err) {
    console.error('error in request:' + err);
  });
}

async function uploadAsset(path, name, releaseId) {
  const UPLOAD_ASSET_URL = `https://uploads.github.com/repos/Natalya11444/metamask-extension/releases/${releaseId}/assets?name=${name}&label=${name}`;
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
