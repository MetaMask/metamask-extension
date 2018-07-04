const beefy = require('beefy')
const http = require('http')
const port = 8124

const handler = beefy({
    entries: {'mocker.js': 'bundle.js'},
   cwd: __dirname,
   live: true,
   open: true,
   quiet: false,
   bundlerFlags: ['-t', 'brfs'],
})


http.createServer(handler).listen(port)
console.log(`Now listening on port ${port}`)
