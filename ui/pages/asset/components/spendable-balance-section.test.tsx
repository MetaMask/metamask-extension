import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import * as stellarAssetsSelectors from '../../../selectors/stellar-assets';
import { SpendableBalanceSection } from './spendable-balance-section';

jest.mock('../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (n: number) => `$${n.toFixed(2)}`,
}));

jest.mock('../../../selectors/stellar-assets', () => ({
  getStellarBaseReserveForAccountAsset: jest.fn(),
}));

const STELLAR_NATIVE_ASSET_ID =
  `${XlmScope.Pubnet}/slip44:148` as CaipAssetType;
const ACCOUNT_ID = 'stellar-account-id';

const store = configureMockStore()({
  metamask: { currentCurrency: 'usd' },
  locale: { currentLocale: 'en' },
});

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <I18nContext.Provider value={tEn as any}>
        {component}
      </I18nContext.Provider>
    </Provider>,
  );

describe('SpendableBalanceSection', () => {
  const getStellarBaseReserveForAccountAssetMock =
    stellarAssetsSelectors.getStellarBaseReserveForAccountAsset as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders total, spendable, and reserved balances', () => {
    getStellarBaseReserveForAccountAssetMock.mockReturnValue('2.5');

    renderWithProviders(
      <SpendableBalanceSection
        accountId={ACCOUNT_ID}
        assetId={STELLAR_NATIVE_ASSET_ID}
        totalBalance="250"
        symbol="XLM"
        fiatValue={105}
      />,
    );

    expect(screen.getByTestId('spendable-balance-section')).toBeInTheDocument();
    expect(screen.getByText(messages.balance.message)).toBeInTheDocument();
    expect(
      screen.getByTestId('spendable-balance-total-balance'),
    ).toHaveTextContent('250 XLM');
    expect(
      screen.getByTestId('spendable-balance-spendable-balance'),
    ).toHaveTextContent('247.5 XLM');
    expect(
      screen.getByTestId('spendable-balance-base-reserved'),
    ).toHaveTextContent('2.5 XLM');
    expect(
      screen.getByTestId('spendable-balance-fiat-value'),
    ).toHaveTextContent('$105.00');
  });

  it('returns null when base reserve is unavailable', () => {
    getStellarBaseReserveForAccountAssetMock.mockReturnValue(undefined);

    const { container } = renderWithProviders(
      <SpendableBalanceSection
        accountId={ACCOUNT_ID}
        assetId={STELLAR_NATIVE_ASSET_ID}
        totalBalance="250"
        symbol="XLM"
        fiatValue={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('returns null for assets that do not support base reserve', () => {
    const { container } = renderWithProviders(
      <SpendableBalanceSection
        accountId={ACCOUNT_ID}
        assetId={'eip155:1/slip44:60' as CaipAssetType}
        totalBalance="250"
        symbol="ETH"
        fiatValue={null}
      />,
    );

    expect(getStellarBaseReserveForAccountAssetMock).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
