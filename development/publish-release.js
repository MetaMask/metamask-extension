const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const request = require('request-promise')
const VERSION = require('../dist/chrome/manifest.json').version;

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
    },
  }).then(function (response) {
    releaseId =  response.id
    console.log('releaseId: ' + releaseId );

  })
    .catch(function (err) {
      console.error('error in request:' + err);
    });
}
