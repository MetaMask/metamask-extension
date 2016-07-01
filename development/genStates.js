const fs = require('fs')
const path = require('path')

const statesPath = path.join(__dirname, 'states')
const stateNames = fs.readdirSync(statesPath)

const states = stateNames.reduce((result, stateFileName) => {
  const statePath = path.join(__dirname, 'states', stateFileName)
  const stateFile = fs.readFileSync(statePath).toString()
  const state = JSON.parse(stateFile)
  result[stateFileName.split('.')[0].replace(/-/g, ' ', 'g')] = state
  return result
}, {})

const result = `module.exports = ${JSON.stringify(states)}`

const statesJsonPath = path.join(__dirname, 'states.js')
fs.writeFileSync(statesJsonPath, result)
