const { promises: fs } = require('fs')
const path = require('path')
const Koa = require('koa')

const CURRENT_STATE_KEY = '__CURRENT__'
const DEFAULT_STATE_KEY = '__DEFAULT__'

const FIXTURE_SERVER_HOST = 'localhost'
const FIXTURE_SERVER_PORT = 12345

class FixtureServer {
  constructor() {
    this._app = new Koa()
    this._stateMap = new Map([[DEFAULT_STATE_KEY, Object.create(null)]])
    this._initialStateCache = new Map()

    this._app.use(async (ctx) => {
      // Firefox is _super_ strict about needing CORS headers
      ctx.set('Access-Control-Allow-Origin', '*')
      if (this._isStateRequest(ctx)) {
        ctx.body = this._stateMap.get(CURRENT_STATE_KEY)
      }
    })
  }

  async start() {
    const options = {
      host: FIXTURE_SERVER_HOST,
      port: FIXTURE_SERVER_PORT,
      exclusive: true,
    }

    return new Promise((resolve, reject) => {
      this._server = this._app.listen(options)
      this._server.once('error', reject)
      this._server.once('listening', resolve)
    })
  }

  async stop() {
    if (!this._server) {
      return
    }

    await new Promise((resolve, reject) => {
      this._server.close()
      this._server.once('error', reject)
      this._server.once('close', resolve)
    })
  }

  async loadState(directory) {
    const statePath = path.resolve(__dirname, directory, 'state.json')

    let state
    if (this._initialStateCache.has(statePath)) {
      state = this._initialStateCache.get(statePath)
    } else {
      const data = await fs.readFile(statePath)
      state = JSON.parse(data.toString('utf-8'))
      this._initialStateCache.set(statePath, state)
    }

    this._stateMap.set(CURRENT_STATE_KEY, state)
  }

  _isStateRequest(ctx) {
    return ctx.method === 'GET' && ctx.path === '/state.json'
  }
}

module.exports = FixtureServer
