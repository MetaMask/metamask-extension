#!/usr/bin/env node
const request = require('request-promise')
const { version } = require('../dist/chrome/manifest.json')

const GITHUB_COMMENT_TOKEN = process.env.GITHUB_COMMENT_TOKEN
const CIRCLE_PULL_REQUEST = process.env.CIRCLE_PULL_REQUEST
console.log('CIRCLE_PULL_REQUEST', CIRCLE_PULL_REQUEST)
const CIRCLE_SHA1 = process.env.CIRCLE_SHA1
console.log('CIRCLE_SHA1', CIRCLE_SHA1)
const CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM
console.log('CIRCLE_BUILD_NUM', CIRCLE_BUILD_NUM)

const CIRCLE_PR_NUMBER = CIRCLE_PULL_REQUEST.split('/').pop()
const SHORT_SHA1 = CIRCLE_SHA1.slice(0,7)
const BUILD_LINK_BASE = `https://${CIRCLE_BUILD_NUM}-42009758-gh.circle-artifacts.com/0`

const MASCARA = `${BUILD_LINK_BASE}/builds/mascara/home.html`
const CHROME = `${BUILD_LINK_BASE}/builds/metamask-chrome-${version}.zip`
const FIREFOX = `${BUILD_LINK_BASE}/builds/metamask-firefox-${version}.zip`
const EDGE = `${BUILD_LINK_BASE}/builds/metamask-edge-${version}.zip`
const OPERA = `${BUILD_LINK_BASE}/builds/metamask-opera-${version}.zip`
const WALKTHROUGH = `${BUILD_LINK_BASE}/test-artifacts/screens/walkthrough%20%28en%29.gif`

const commentBody = `
<details>
  <summary>
    Builds ready [${SHORT_SHA1}]:
    <a href="${MASCARA}">mascara</a>,
    <a href="${CHROME}">chrome</a>,
    <a href="${FIREFOX}">firefox</a>,
    <a href="${EDGE}">edge</a>,
    <a href="${OPERA}">opera</a>
  </summary>
  <image src="${WALKTHROUGH}">
</details>
`

const JSON_PAYLOAD = JSON.stringify({ body: commentBody })
const POST_COMMENT_URI = `https://api.github.com/repos/metamask/metamask-extension/issues/${CIRCLE_PR_NUMBER}/comments`
console.log(`Announcement:\n${commentBody}`)
console.log(`Posting to: ${POST_COMMENT_URI}`)

request({
    method: 'POST',
    uri: POST_COMMENT_URI,
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      'Authorization': `token ${GITHUB_COMMENT_TOKEN}`,
    },
})
