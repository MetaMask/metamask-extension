<<<<<<< HEAD
var manifest = require('../app/manifest.json')
var version = manifest.version

var fs = require('fs')
var path = require('path')
var changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md')).toString()
=======
const manifest = require('../app/manifest.json')

const version = manifest.version

const fs = require('fs')
const path = require('path')

const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md')).toString()
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

var log = changelog.split(version)[1].split('##')[0].trim()

const msg = `*MetaMask ${version}* now published! It should auto-update soon!\n${log}`

console.log(msg)
