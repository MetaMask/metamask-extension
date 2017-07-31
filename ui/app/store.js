const createStore = require('redux').createStore
const applyMiddleware = require('redux').applyMiddleware
const thunkMiddleware = require('redux-thunk')
const rootReducer = require('./reducers')
const createLogger = require('redux-logger')

global.METAMASK_DEBUG = 'GULP_METAMASK_DEBUG'

module.exports = configureStore

const loggerMiddleware = createLogger({
  predicate: () => global.METAMASK_DEBUG,
})

const middlewares = [thunkMiddleware, loggerMiddleware]

const createStoreWithMiddleware = applyMiddleware(...middlewares)(createStore)

function configureStore (initialState) {
  return createStoreWithMiddleware(rootReducer, initialState, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
}
