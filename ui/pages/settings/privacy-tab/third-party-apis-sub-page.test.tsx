import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import ThirdPartyApisSubPage from './third-party-apis-sub-page';

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ThirdPartyApisSubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  describe('snapshot', () => {
    it('matches snapshot', () => {
      const { container } = renderWithProvider(
        <ThirdPartyApisSubPage />,
        mockStore,
      );

      expect(container).toMatchSnapshot();
    });
  });
});
