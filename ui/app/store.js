const createStore = require('redux').createStore
const applyMiddleware = require('redux').applyMiddleware
const thunkMiddleware = require('redux-thunk')
const rootReducer = require('./reducers')
const developmentMode = require('../../app/scripts/config').developmentMode

module.exports = configureStore

const middlewares = [thunkMiddleware]

console.log(developmentMode)
if (developmentMode) {
  console.log('Development Mode ON.')
  const createLogger = require('redux-logger')
  const loggerMiddleware = createLogger()
  middlewares.push(loggerMiddleware)
} else {
  console.log('Development Mode OFF.')
}


const createStoreWithMiddleware = applyMiddleware(...middlewares
)(createStore)

function configureStore (initialState) {
  return createStoreWithMiddleware(rootReducer, initialState)
}

// import thunk from 'redux-thunk';
//
// const middlewares = [thunk];
//
// if (process.env.NODE_ENV === `development`) {
//   const createLogger = require(`redux-logger`);
//   const logger = createLogger();
//   middlewares.push(logger);
// }
//
// const store = compose(applyMiddleware(...middlewares))(createStore)(reducer);
