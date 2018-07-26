const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const request = require('request-promise');
const VERSION = require('../dist/chrome/manifest.json').version;
const fs = require('fs');

start().catch(console.error);

async function start () {
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
    + "&target_commitish=" + SHORT_SHA1 + "&name=v" +  VERSION;
  console.log(`Posting to: ${CREATE_RELEASE_URI}`)

  await request({
    method: 'POST',
    uri: CREATE_RELEASE_URI,
    body: "New release",
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'Nifty Wallet'
    }
  }).then(async function (response) {
    releaseId =  response.id
    console.log('releaseId: ' + releaseId );

    const UPLOAD_ASSET_URL = "https://api.github.com/repos/Natalya11444/metamask-extension/releases/" + releaseId + "/assets?name=";
    await request({
      method: 'POST',
      uri: UPLOAD_ASSET_URL + `metamask-chrome-${VERSION}.zip`,
      body: fs.readFileSync('./builds/metamask-chrome-${VERSION}.zip'),
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        "Content-Type" : "application/zip",
        'User-Agent': 'Nifty Wallet'
      }
    })

    const CHROME = `${BUILD_LINK_BASE}/builds/metamask-chrome-${VERSION}.zip`
    const FIREFOX = `${BUILD_LINK_BASE}/builds/metamask-firefox-${VERSION}.zip`
    const EDGE = `${BUILD_LINK_BASE}/builds/metamask-edge-${VERSION}.zip`
    const OPERA = `${BUILD_LINK_BASE}/builds/metamask-opera-${VERSION}.zip`

  })
    .catch(function (err) {
      console.error('error in request:' + err);
    });
}
