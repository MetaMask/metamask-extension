import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import type { Hex } from '@metamask/utils';
import { I18nContext } from '../../../contexts/i18n';
import { enLocale as messages, tEn } from '../../../../test/lib/i18n-helpers';
import type { TokenWithFiatAmount } from '../../../components/app/assets/types';
import { MusdConvertSection } from './musd-convert-section';

const mockConversionTokens: { current: TokenWithFiatAmount[] } = {
  current: [],
};

jest.mock('../../../hooks/musd/useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/musd', () => ({
  useMusdConversion: () => ({
    startConversionFlow: jest.fn().mockResolvedValue(undefined),
  }),
  useMusdConversionTokens: () => ({
    tokens: mockConversionTokens.current,
  }),
}));

jest.mock('../../../selectors/musd', () => {
  const actual = jest.requireActual('../../../selectors/musd');
  return {
    ...actual,
    selectIsMusdConversionFlowEnabled: () => true,
  };
});

jest.mock('../../../selectors/multichain', () => ({
  ...jest.requireActual('../../../selectors/multichain'),
  getMultichainNetworkConfigurationsByChainId: () => ({}),
  getImageForChainId: () => '',
}));

jest.mock('../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (n: number) => `$${n.toFixed(2)}`,
}));

const store = configureMockStore()({
  metamask: {
    remoteFeatureFlags: {},
  },
});

function buildToken(
  partial: Partial<TokenWithFiatAmount> & { symbol: string },
) {
  return {
    address: '0x0000000000000000000000000000000000000001' as Hex,
    chainId: '0x1' as Hex,
    decimals: 18,
    image: '',
    title: partial.symbol,
    tokenFiatAmount: 100,
    ...partial,
  } as TokenWithFiatAmount;
}

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <I18nContext.Provider value={tEn as any}>
        {component}
      </I18nContext.Provider>
    </Provider>,
  );

describe('MusdConvertSection', () => {
  beforeEach(() => {
    mockConversionTokens.current = [];
  });

  beforeAll(() => {
    Object.defineProperty(global, 'platform', {
      value: { openTab: jest.fn() },
      configurable: true,
    });
  });

  it('renders benefit tags in a grid and learn more when no convertible tokens', () => {
    renderWithProviders(<MusdConvertSection />);

    expect(screen.getByTestId('musd-convert-section')).toBeInTheDocument();
    expect(screen.getByTestId('musd-convert-benefit-tags')).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetConvertBenefitDollarBacked.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetConvertBenefitNoLockups.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetConvertBenefitNoMetaMaskFee.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetConvertBenefitDailyBonus.message),
    ).toBeInTheDocument();

    const learnMore = screen.getByTestId('musd-learn-more-button');
    expect(learnMore).toBeInTheDocument();
    fireEvent.click(learnMore);
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://support.metamask.io/manage-crypto/tokens/musd',
    });

    expect(
      screen.queryByRole('button', { name: messages.musdConvert.message }),
    ).toBeNull();
  });

  it('renders convert rows for held stablecoins with fiat formatted as BodyMd', () => {
    mockConversionTokens.current = [
      buildToken({ symbol: 'USDC', tokenFiatAmount: 5000 }),
    ];

    renderWithProviders(<MusdConvertSection />);

    expect(screen.getByText('$5000.00')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.musdConvert.message }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('musd-convert-benefit-tags')).toBeInTheDocument();
  });

  it('renders stacked avatars and benefit tags when user has convertible tokens but no stablecoins', () => {
    mockConversionTokens.current = [
      buildToken({ symbol: 'WETH', tokenFiatAmount: 200 }),
    ];

    renderWithProviders(<MusdConvertSection />);

    const stackedSection = screen.getByTestId('musd-stacked-avatars');
    expect(stackedSection).toBeInTheDocument();

    const avatarImages = stackedSection.querySelectorAll('img');
    expect(avatarImages).toHaveLength(3);
    expect(avatarImages[0]).toHaveAttribute('alt', 'USDC');
    expect(avatarImages[1]).toHaveAttribute('alt', 'USDT');
    expect(avatarImages[2]).toHaveAttribute('alt', 'DAI');

    expect(
      screen.queryByRole('button', { name: messages.musdConvert.message }),
    ).toBeNull();
    expect(screen.getByTestId('musd-convert-benefit-tags')).toBeInTheDocument();
  });

  it('renders section title', () => {
    renderWithProviders(<MusdConvertSection />);
    expect(
      screen.getByText(messages.musdAssetConvertTitle.message),
    ).toBeInTheDocument();
  });
});
