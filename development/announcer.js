var manifest = require('../app/manifest.json')
var version = manifest.version

var fs = require('fs')
var path = require('path')
var changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md')).toString()

var log = changelog.split(version)[1].split('##')[0].trim()

let msg = `*MetaMask ${version}* now published to the Chrome Store! It should auto-update over the next hour!\n${log}`

console.log(msg)
