const CGanache = require('@yqrashawn/conflux-local-network-lite')
const server = new CGanache({ verbose: true })
server
  .start()
  .then(async () => {
    console.log('Ganache Testrpc is running on "http://localhost:12539"')
    await server.quit()
  })
  .catch(err => {
    console.error(err)
  })
