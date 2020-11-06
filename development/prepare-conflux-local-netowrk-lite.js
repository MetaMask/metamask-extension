const Node = require('@cfxjs/fullnode')

const server = new Node()
server
  .start()
  .then(async () => {
    await server.quit()
  })
  .catch(err => {
    console.error(err)
  })
