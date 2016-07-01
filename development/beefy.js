const beefy = require('beefy')
const http = require('http')
const fs = require('fs')
const path = require('path')
const states = require('./states')

const statesPath = path.join(__dirname, 'states.js')
const statesJson = JSON.stringify(states)
fs.writeFileSync(statesPath, statesJson)

const port = 8124

const handler = beefy({
    entries: ['mocker.js']
  , cwd: __dirname
  , live: true
  , quiet: false
  , bundlerFlags: ['-t', 'brfs']
})

console.dir(handler)

http.createServer(handler).listen(port)
console.log(`Now listening on port ${port}`)

function on404(req, resp) {
  resp.writeHead(404, {})
  resp.end('sorry folks!')
}
