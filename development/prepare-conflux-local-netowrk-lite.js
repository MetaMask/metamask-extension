const CGanache = require('@yqrashawn/conflux-local-network-lite')

const server = new CGanache()
server
  .start()
  .then(async () => {
    await server.quit()
  })
  .catch((err) => {
    console.error(err)
  })
