const FixtureServer = require('./fixture-server')
const path = require('path')
// const sleep = require('sleep-promise')

const fixtureServer = new FixtureServer()

;(async function() {
  await fixtureServer.start()
  await fixtureServer.loadState(
    path.join(__dirname, 'fixtures', 'imported-account')
  )
  // await sleep(3600000)
})()
