const createStore = require('redux').createStore
const applyMiddleware = require('redux').applyMiddleware
const thunkMiddleware = require('redux-thunk')
const createLogger = require('redux-logger')
const rootReducer = require('../ui/app/reducers')

module.exports = configureStore

const loggerMiddleware = createLogger()

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  loggerMiddleware
)(createStore)

function configureStore (initialState) {
  return createStoreWithMiddleware(rootReducer, initialState)
}
