import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { composeWithDevTools } from 'remote-redux-devtools';
import rootReducer from '../ducks';

const logger = createLogger({
  collapsed: true,
});

export default function configureStore(initialState) {
  const composeEnhancers = composeWithDevTools({
    name: 'MetaMask',
    hostname: 'localhost',
    port: 8000,
    realtime: Boolean(process.env.METAMASK_DEBUG),
  });
  return createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(thunkMiddleware, logger)),
  );
}
