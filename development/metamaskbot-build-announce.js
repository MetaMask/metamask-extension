#!/usr/bin/env node
const request = require('request-promise')
const VERSION = require('../dist/chrome/manifest.json').version

start().catch(console.error)

async function start () {

  const GITHUB_COMMENT_TOKEN = process.env.GITHUB_COMMENT_TOKEN
  const CIRCLE_PULL_REQUEST = process.env.CIRCLE_PULL_REQUEST
  console.log('CIRCLE_PULL_REQUEST', CIRCLE_PULL_REQUEST)
  const CIRCLE_SHA1 = process.env.CIRCLE_SHA1
  console.log('CIRCLE_SHA1', CIRCLE_SHA1)
  const CIRCLE_BUILD_NUM = process.env.CIRCLE_BUILD_NUM
  console.log('CIRCLE_BUILD_NUM', CIRCLE_BUILD_NUM)

  if (!CIRCLE_PULL_REQUEST) {
    console.warn(`No pull request detected for commit "${CIRCLE_SHA1}"`)
    return
  }

  const CIRCLE_PR_NUMBER = CIRCLE_PULL_REQUEST.split('/').pop()
  const SHORT_SHA1 = CIRCLE_SHA1.slice(0, 7)
  const BUILD_LINK_BASE = `https://${CIRCLE_BUILD_NUM}-42009758-gh.circle-artifacts.com/0`

  // build the github comment content

  // links to extension builds
  const platforms = ['chrome', 'firefox', 'opera', 'edge']
  const buildLinks = platforms.map(platform => {
    const url = `${BUILD_LINK_BASE}/builds/metamask-${platform}-${VERSION}.zip`
    return `<a href="${url}">${platform}</a>`
  }).join(', ')

  // links to bundle browser builds
  const bundles = ['background', 'ui', 'inpage', 'contentscript', 'ui-libs', 'bg-libs', 'phishing-detect']
  const bundleLinks = bundles.map(bundle => {
    const url = `${BUILD_LINK_BASE}/build-artifacts/source-map-explorer/${bundle}.html`
    return `<a href="${url}">${bundle}</a>`
  }).join(', ')

  // links to bundle browser builds
  const depVizUrl = `${BUILD_LINK_BASE}/build-artifacts/deps-viz/background/index.html`
  const depVizLink = `<a href="${depVizUrl}">background</a>`

  // link to artifacts
  const allArtifactsUrl = `https://circleci.com/gh/MetaMask/metamask-extension/${CIRCLE_BUILD_NUM}#artifacts/containers/0`

  const contentRows = [
    `builds: ${buildLinks}`,
    `bundle viz: ${bundleLinks}`,
    `dep viz: ${depVizLink}`,
    `<a href="${allArtifactsUrl}">all artifacts</a>`,
  ]
  const hiddenContent = `<ul>` + contentRows.map(row => `<li>${row}</li>`).join('\n') + `</ul>`
  const exposedContent = `Builds ready [${SHORT_SHA1}]`
  const commentBody = `<details><summary>${exposedContent}</summary>${hiddenContent}</details>`

  const JSON_PAYLOAD = JSON.stringify({ body: commentBody })
  const POST_COMMENT_URI = `https://api.github.com/repos/metamask/metamask-extension/issues/${CIRCLE_PR_NUMBER}/comments`
  console.log(`Announcement:\n${commentBody}`)
  console.log(`Posting to: ${POST_COMMENT_URI}`)

  await request({
    method: 'POST',
    uri: POST_COMMENT_URI,
    body: JSON_PAYLOAD,
    headers: {
      'User-Agent': 'metamaskbot',
      'Authorization': `token ${GITHUB_COMMENT_TOKEN}`,
    },
  })

}
