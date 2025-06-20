import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { setBackgroundConnection } from '../../../store/background-connection';
import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
} from '../../../../test/jest';
import {
  setSwapsFromToken,
  navigateBackToPrepareSwap,
} from '../../../ducks/swaps/swaps';
import CreateNewSwap from '.';

const middleware = [thunk];
const createProps = (customProps = {}) => {
  return {
    sensitiveProperties: {},
    ...customProps,
  };
};

const backgroundConnection = {
  navigateBackToPrepareSwap: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
  navigatedBackToBuildQuote: jest.fn(),
};

setBackgroundConnection(backgroundConnection);

jest.mock('../../../ducks/swaps/swaps', () => {
  const actual = jest.requireActual('../../../ducks/swaps/swaps');
  return {
    ...actual,
    setSwapsFromToken: jest.fn(),
    navigateBackToPrepareSwap: jest.fn(),
  };
});

describe('CreateNewSwap', () => {
  const props = createProps({ sensitiveTrackingProperties: {} });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());

    const { getByText } = renderWithProvider(
      <CreateNewSwap {...props} />,
      store,
    );
    expect(getByText('Create a new swap')).toBeInTheDocument();
  });

  it('clicks on the Make another swap link', async () => {
    const setSwapFromTokenMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    setSwapsFromToken.mockImplementation(setSwapFromTokenMock);
    const navigateBackToPrepareSwapMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    navigateBackToPrepareSwap.mockImplementation(navigateBackToPrepareSwapMock);
    const store = configureMockStore(middleware)(createSwapsMockStore());

    const { getByText } = renderWithProvider(
      <CreateNewSwap {...props} />,
      store,
    );
    await fireEvent.click(getByText('Create a new swap'));
    expect(setSwapFromTokenMock).toHaveBeenCalledTimes(1);
    expect(navigateBackToPrepareSwapMock).toHaveBeenCalledTimes(1);
  });
});
