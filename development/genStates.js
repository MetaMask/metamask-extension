const fs = require('fs')
const path = require('path')
const promisify = require('pify')
const enLocaleMessages = require('../app/_locales/en/messages.json')


start().catch(console.error)

async function start () {
  const statesPath = path.join(__dirname, 'states')
  const stateFilesNames = await promisify(fs.readdir)(statesPath)
  const states = {}
  await Promise.all(stateFilesNames.map(async (stateFileName) => {
    const stateFilePath = path.join(__dirname, 'states', stateFileName)
    const stateFileContent = await promisify(fs.readFile)(stateFilePath, 'utf8')
    const state = JSON.parse(stateFileContent)

    state.localeMessages = { en: enLocaleMessages, current: {} }

    const stateName = stateFileName.split('.')[0].replace(/-/g, ' ', 'g')
    states[stateName] = state
  }))
  const generatedFileContent = `module.exports = ${JSON.stringify(states)}`
  const generatedFilePath = path.join(__dirname, 'states.js')
  await promisify(fs.writeFile)(generatedFilePath, generatedFileContent)
}
