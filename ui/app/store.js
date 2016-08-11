const createStore = require('redux').createStore
const applyMiddleware = require('redux').applyMiddleware
const thunkMiddleware = require('redux-thunk')
const rootReducer = require('./reducers')
const developmentMode = require('../../app/scripts/config').developmentMode
const createLogger = require('redux-logger')

module.exports = configureStore

const middlewares = [thunkMiddleware]

if (developmentMode) {
  console.log('Development Mode ON.')
  const loggerMiddleware = createLogger()
  middlewares.push(loggerMiddleware)
}


const createStoreWithMiddleware = applyMiddleware(...middlewares
)(createStore)

function configureStore (initialState) {
  return createStoreWithMiddleware(rootReducer, initialState)
}
