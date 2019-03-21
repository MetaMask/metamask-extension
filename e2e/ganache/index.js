const ganache = require('ganache-cli')
const getPort = require('get-port')

class Ganache {
  async start (options) {
    const port = await getPort()
    this._server = ganache.server(options)
    return new Promise((resolve, reject) => {
      this._server.listen(port, (err, blockchain) => {
        if (err) {
          return reject(err)
        }

        resolve({
          ...blockchain,
          port,
        })
      })
    })
  }

  async quit () {
    if (!this._server) {
      return Promise.reject(new Error('Server not running yet'))
    }

    return new Promise((resolve, reject) => {
      this._server.close((err) => {
        if (err) {
          reject(err)
        }

        resolve()
      })
    })
  }
}

module.exports = {
  Ganache,
}
