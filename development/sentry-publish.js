#!/usr/bin/env node
const childProcess = require('child_process')
const pify = require('pify')

const exec = pify(childProcess.exec, { multiArgs: true })
const VERSION = require('../dist/chrome/manifest.json').version // eslint-disable-line import/no-unresolved

start().catch(console.error)

async function start() {
  const authWorked = await checkIfAuthWorks()
  if (!authWorked) {
    console.log(`Sentry auth failed...`)
  }
  // check if version exists or not
  const versionAlreadyExists = await checkIfVersionExists()
  // abort if versions exists
  if (versionAlreadyExists) {
    console.log(
      `Version "${VERSION}" already exists on Sentry, skipping version creation`,
    )
  } else {
    // create sentry release
    console.log(`creating Sentry release for "${VERSION}"...`)
    await exec(
      `sentry-cli releases --org 'metamask' --project 'metamask' new ${VERSION}`,
    )
    console.log(
      `removing any existing files from Sentry release "${VERSION}"...`,
    )
    await exec(
      `sentry-cli releases --org 'metamask' --project 'metamask' files ${VERSION} delete --all`,
    )
  }

  // check if version has artifacts or not
  const versionHasArtifacts =
    versionAlreadyExists && (await checkIfVersionHasArtifacts())
  if (versionHasArtifacts) {
    console.log(
      `Version "${VERSION}" already has artifacts on Sentry, skipping sourcemap upload`,
    )
    return
  }

  // upload sentry source and sourcemaps
  await exec(`./development/sentry-upload-artifacts.sh --release ${VERSION}`)
}

async function checkIfAuthWorks() {
  const itWorked = await doesNotFail(async () => {
    await exec(`sentry-cli releases --org 'metamask' --project 'metamask' list`)
  })
  return itWorked
}

async function checkIfVersionExists() {
  const versionAlreadyExists = await doesNotFail(async () => {
    await exec(
      `sentry-cli releases --org 'metamask' --project 'metamask' info ${VERSION}`,
    )
  })
  return versionAlreadyExists
}

async function checkIfVersionHasArtifacts() {
  const artifacts = await exec(
    `sentry-cli releases --org 'metamask' --project 'metamask' files ${VERSION} list`,
  )
  // When there's no artifacts, we get a response from the shell like this ['', '']
  return artifacts[0] && artifacts[0].length > 0
}

async function doesNotFail(asyncFn) {
  try {
    await asyncFn()
    return true
  } catch (err) {
    return false
  }
}
