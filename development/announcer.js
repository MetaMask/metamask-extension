const manifest = require('../app/manifest.json')
const version = manifest.version

const fs = require('fs')
const path = require('path')
const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md')).toString()

const log = changelog.split(version)[1].split('##')[0].trim()

const msg = `*MetaMask ${version}* now published! It should auto-update soon!\n${log}`

console.log(msg)
