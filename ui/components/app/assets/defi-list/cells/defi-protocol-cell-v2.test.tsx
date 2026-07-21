import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Route, Routes } from 'react-router-dom';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../../test/data/mock-state.json';
import DeFiProtocolCellV2, {
  type DeFiProtocolListItem,
} from './defi-protocol-cell-v2';

jest.mock('../../../../../../ui/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    createEventBuilder: jest.fn(() => ({
      addCategory: jest.fn().mockReturnThis(),
      addProperties: jest.fn().mockReturnThis(),
      build: jest.fn(() => ({})),
    })),
  }),
}));

const position: DeFiProtocolListItem = {
  chainId: 'eip155:1',
  protocolId: 'curve',
  tokenImage: 'curve.png',
  underlyingSymbols: ['USDC'],
  iconGroup: [{ avatarValue: 'usdc.png', symbol: 'USDC' }],
  tokenFiatAmount: 10,
  marketValue: '$10.00',
};

describe('DeFiProtocolCellV2', () => {
  const store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onClick with chain and protocol ids when clicked', () => {
    const onClick = jest.fn();

    renderWithProvider(
      <Routes>
        <Route
          path="/"
          element={<DeFiProtocolCellV2 position={position} onClick={onClick} />}
        />
      </Routes>,
      store,
      '/',
    );

    fireEvent.click(screen.getByTestId('multichain-token-list-button'));

    expect(onClick).toHaveBeenCalledWith('eip155:1', 'curve');
  });
});
