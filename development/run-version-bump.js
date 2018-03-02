const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const path = require('path')
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
const manifestPath = path.join(__dirname, '..', 'app', 'manifest.json')
const manifest = require('../app/manifest.json')
const versionBump = require('./version-bump')

console.dir(process.argv)
const bumpType = normalizeType(process.argv[2])


readFile(changelogPath)
.then(async (changeBuffer) => {
  const changelog = changeBuffer.toString()

  const newData = await versionBump(bumpType, changelog, manifest)
  console.dir(newData)

  const manifestString = JSON.stringify(newData.manifest, null, 2)

  console.log('now writing files to ', changelogPath, manifestPath)
  console.log(typeof newData.manifest)
  await writeFile(changelogPath, newData.changelog)
  await writeFile(manifestPath, manifestString)

  return newData.version
})
.then((version) => console.log(`Bumped ${bumpType} to version ${version}`))
.catch(console.error)


function normalizeType (userInput) {
  console.log(`user inputted ${userInput}`)
  const err = new Error('First option must be a type (major, minor, or patch)')
  if (!userInput || typeof userInput !== 'string') {
    console.log('first no')
    throw err
  }

  const lower = userInput.toLowerCase()

  if (lower !== 'major' && lower !== 'minor' && lower !== 'patch') {
    console.log('second no')
    throw err
  }

  return lower
}
