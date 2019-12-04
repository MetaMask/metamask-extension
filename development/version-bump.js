const clone = require('clone')

async function versionBump (bumpType, changelog, oldManifest) {
  const manifest = clone(oldManifest)
  const newVersion = newVersionFrom(manifest, bumpType)

  manifest.version = newVersion
  const date = (new Date()).toDateString()

  const logHeader = `\n## ${newVersion} ${date}`
  const logLines = changelog.split('\n')
  for (let i = 0; i < logLines.length; i++) {
    if (logLines[i].includes('Current Develop Branch')) {
      logLines.splice(i + 1, 0, logHeader)
      break
    }
  }

  return {
    version: newVersion,
    manifest: manifest,
    changelog: logLines.join('\n'),
  }
}

function newVersionFrom (manifest, bumpType) {
  const string = manifest.version
  const segments = string.split('.').map((str) => parseInt(str))

  switch (bumpType) {
    case 'major':
      segments[0] += 1
      segments[1] = 0
      segments[2] = 0
      break
    case 'minor':
      segments[1] += 1
      segments[2] = 0
      break
    case 'patch':
      segments[2] += 1
      break
  }

  return segments.map(String).join('.')
}

module.exports = versionBump
