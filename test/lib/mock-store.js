import { applyMiddleware, createStore } from 'redux'
import thunkMiddleware from 'redux-thunk'

const rootReducer = function () {}

export default configureStore

const createStoreWithMiddleware = applyMiddleware(thunkMiddleware)(createStore)

function configureStore (initialState) {
  return createStoreWithMiddleware(rootReducer, initialState)
}
