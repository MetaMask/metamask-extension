import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Route, Routes } from 'react-router-dom';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import DeFiProtocolCellV2, {
  type DeFiProtocolListItem,
} from './defi-protocol-cell-v2';

const mockTrackEvent = jest.fn();
const mockBuild = jest.fn(() => ({ event: 'built' }));
const mockAddCategory = jest.fn().mockReturnThis();
const mockAddProperties = jest.fn().mockReturnThis();
const mockCreateEventBuilder = jest.fn(() => ({
  addCategory: mockAddCategory,
  addProperties: mockAddProperties,
  build: mockBuild,
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: mockCreateEventBuilder,
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

  it('renders protocol id and market value', () => {
    renderWithProvider(
      <Routes>
        <Route
          path="/"
          element={
            <DeFiProtocolCellV2 position={position} onClick={jest.fn()} />
          }
        />
      </Routes>,
      store,
      '/',
    );

    expect(
      screen.getByTestId('multichain-token-list-item-token-name'),
    ).toHaveTextContent('curve');
    expect(screen.getByTestId('defi-list-market-value')).toHaveTextContent(
      '$10.00',
    );
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

  it('tracks a DeFi details opened event with chain and protocol ids on click', () => {
    renderWithProvider(
      <Routes>
        <Route
          path="/"
          element={
            <DeFiProtocolCellV2 position={position} onClick={jest.fn()} />
          }
        />
      </Routes>,
      store,
      '/',
    );

    fireEvent.click(screen.getByTestId('multichain-token-list-button'));

    expect(mockCreateEventBuilder).toHaveBeenCalledWith(
      MetaMetricsEventName.DeFiDetailsOpened,
    );
    expect(mockAddCategory).toHaveBeenCalledWith(MetaMetricsEventCategory.DeFi);
    expect(mockAddProperties).toHaveBeenCalledWith({
      location: 'Home',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      chain_id: 'eip155:1',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      protocol_id: 'curve',
    });
    expect(mockTrackEvent).toHaveBeenCalledWith({ event: 'built' });
  });
});
