import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/lib/render-helpers';

import { Confirm } from '.';

const middleware = [thunk];

describe('Confirm', () => {
  it('should render', () => {
    const mockStore = configureMockStore(middleware)(mockState);
    const { container } = renderWithProvider(Confirm, mockStore);
    expect(container).toBeDefined();
  });
});
