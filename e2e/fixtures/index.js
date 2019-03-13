const fs = require('fs')
const Koa = require('koa')
const path = require('path')

const CURRENT_STATE_KEY = '__CURRENT__'
const DEFAULT_STATE_KEY = '__DEFAULT__'

class FixtureServer {
  constructor () {
    this._app = new Koa()
    this._stateMap = new Map([
      [DEFAULT_STATE_KEY, Object.create(null)],
    ])

    this._app.use(async (ctx) => {
      // Firefox is _super_ strict about needing CORS headers
      ctx.set('Access-Control-Allow-Origin', '*')
      if (this._isStateRequest(ctx)) {
        ctx.body = this._stateMap.get(CURRENT_STATE_KEY)
      }
    })
  }

  async start () {
    return new Promise((resolve) => {
      const options = {
        host: 'localhost',
        port: 12345,
        exclusive: true,
      }
      this._server = this._app.listen(options, resolve)
    })
  }

  async stop () {
    if (!this._server) {
      return new Promise((resolve) => setTimeout(resolve))
    }

    return new Promise((resolve) => {
      this._server.close()
      setTimeout(resolve, 1000)
    })
  }

  async loadState (directory, callback) {
    const statePath = directory ? path.resolve(__dirname, directory, 'state.json') : DEFAULT_STATE_KEY
    if (this._stateMap.has(statePath)) {
      const state = this._stateMap.get(statePath)
      this._stateMap.set(CURRENT_STATE_KEY, state)
    } else {
      const state = await new Promise((resolve, reject) => {
        fs.readFile(statePath, (err, data) => {
          if (err) {
            reject(err)
            return
          }

          resolve(JSON.parse(data.toString('utf-8')))
        })
      })

      this._stateMap.set(statePath, state)
      this._stateMap.set(CURRENT_STATE_KEY, state)
    }

    return callback()
  }

  _isStateRequest (ctx) {
    return ctx.method === 'GET' && ctx.path === '/state.json'
  }
}

module.exports = {
  FixtureServer,
}
