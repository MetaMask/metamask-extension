import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  fireEvent,
  setBackgroundConnection,
} from '../../../../test/jest';
import {
  setSwapsFromToken,
  navigateBackToBuildQuote,
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
  navigateBackToBuildQuote: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
  navigatedBackToBuildQuote: jest.fn(),
};

setBackgroundConnection(backgroundConnection);

jest.mock('../../../ducks/swaps/swaps', () => {
  const actual = jest.requireActual('../../../ducks/swaps/swaps');
  return {
    ...actual,
    setSwapsFromToken: jest.fn(),
    navigateBackToBuildQuote: jest.fn(),
  };
});

describe('CreateNewSwap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const props = createProps();
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
    const navigateBackToBuildQuoteMock = jest.fn(() => {
      return {
        type: 'MOCK_ACTION',
      };
    });
    navigateBackToBuildQuote.mockImplementation(navigateBackToBuildQuoteMock);
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const props = createProps();
    const { getByText } = renderWithProvider(
      <CreateNewSwap {...props} />,
      store,
    );
    await fireEvent.click(getByText('Create a new swap'));
    expect(setSwapFromTokenMock).toHaveBeenCalledTimes(1);
    expect(navigateBackToBuildQuoteMock).toHaveBeenCalledTimes(1);
  });
});
