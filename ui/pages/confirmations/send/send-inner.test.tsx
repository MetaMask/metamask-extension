import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { SendContextProvider } from '../context/send';
import { SendInner } from './send-inner';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: () => [{ get: () => null }],
}));

const mockStore = configureMockStore([])(mockState);

const render = () => {
  return renderWithProvider(
    <SendContextProvider>
      <SendInner />
    </SendContextProvider>,
    mockStore,
  );
};

describe('SendInner', () => {
  it('renders correctly', () => {
    const { getByText } = render();
    expect(getByText('asset')).toBeInTheDocument();
  });
});
