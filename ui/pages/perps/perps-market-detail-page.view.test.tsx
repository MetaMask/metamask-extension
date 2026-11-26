import React from 'react';
import { act, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { AccessRestrictedProvider } from '../../components/app/compliance/access-restricted-context';
import {
  mockAccountState,
  mockCryptoMarkets,
  mockPositions,
} from '../../components/app/perps/mocks';
import { PerpsToastProvider } from '../../components/app/perps/perps-toast/perps-toast-provider';
import {
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_ORDER_ENTRY_ROUTE,
} from '../../helpers/constants/routes';
import { PerpsAttributionProvider } from '../../providers/perps/PerpsAttributionContext';
import {
  getPerpsStreamManager,
  resetPerpsStreamManager,
} from '../../providers/perps/PerpsStreamManager';
import configureStore from '../../store/store';
import PerpsMarketDetailPage from './perps-market-detail-page';
import PerpsOrderEntryPage from './perps-order-entry-page';

jest.mock('../../store/background-connection', () => ({
  ...jest.requireActual('../../store/background-connection'),
  submitRequestToBackground: jest.fn(() => new Promise(() => undefined)),
}));

const [position] = mockPositions;

function renderPositionView(path: string) {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: true,
      isEligible: true,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsEnabledVersion: true,
      },
    },
  });
  const stream = getPerpsStreamManager();
  const { accounts, selectedAccount } = mockState.metamask.internalAccounts;
  stream.init(accounts[selectedAccount as keyof typeof accounts].address);
  stream.account.pushData(mockAccountState);
  stream.markets.pushData(mockCryptoMarkets);
  stream.positions.pushData([
    {
      ...position,
      leverage: { type: 'isolated' },
      cumulativeFunding: undefined,
    },
  ]);

  renderWithProvider(
    <PerpsAttributionProvider>
      <AccessRestrictedProvider>
        <PerpsToastProvider>
          <Routes>
            <Route
              path={`${PERPS_MARKET_DETAIL_ROUTE}/:symbol`}
              element={<PerpsMarketDetailPage />}
            />
            <Route
              path={`${PERPS_ORDER_ENTRY_ROUTE}/:symbol`}
              element={<PerpsOrderEntryPage />}
            />
          </Routes>
        </PerpsToastProvider>
      </AccessRestrictedProvider>
    </PerpsAttributionProvider>,
    store,
    path,
  );
  return stream;
}

describe('live position data', () => {
  beforeEach(() => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      PERPS_ENABLED: 'true',
    });
  });

  afterEach(() => {
    resetPerpsStreamManager();
    jest.restoreAllMocks();
  });

  it('distinguishes unreported leverage and funding from live values, including zero funding', async () => {
    const stream = renderPositionView(
      `${PERPS_MARKET_DETAIL_ROUTE}/${position.symbol}`,
    );
    expect(
      await screen.findByText(`${messages.perpsLong.message} --`),
    ).toBeVisible();
    const funding = screen.getByTestId('perps-position-funding-value');
    expect(funding).toHaveTextContent(/^--$/u);

    act(() =>
      stream.positions.pushData([
        {
          ...position,
          leverage: { type: 'isolated', value: 7 },
          cumulativeFunding: { sinceOpen: '0', allTime: '0', sinceChange: '0' },
        },
      ]),
    );
    expect(
      await screen.findByText(`${messages.perpsLong.message} 7x`),
    ).toBeVisible();
    expect(funding).toHaveTextContent('$0.00');
  });

  it('unlocks the modify form only after the venue reports the position leverage', async () => {
    const stream = renderPositionView(
      `${PERPS_ORDER_ENTRY_ROUTE}/${position.symbol}?mode=modify`,
    );
    expect(
      await screen.findByText(
        messages.perpsPositionLeverageUnavailable.message,
      ),
    ).toBeVisible();
    const submit = screen.getByRole('button', {
      name: messages.perpsModifyPosition.message,
    });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByText(messages.perpsLeverage.message),
    ).not.toBeInTheDocument();

    act(() =>
      stream.positions.pushData([
        { ...position, leverage: { type: 'isolated', value: 7 } },
      ]),
    );
    expect(
      await screen.findByRole('slider', { value: { min: 7, now: 7 } }),
    ).toBeInTheDocument();
    expect(submit).toBeEnabled();
  });
});
