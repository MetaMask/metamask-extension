import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../test/data/mock-state.json';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

export const storeMock = mockStore(mockState);
