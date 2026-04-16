/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { I18nContext } from '../../../contexts/i18n';
import { getMessage } from '../../../helpers/utils/i18n-helper';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import { MusdBonusSection } from './musd-bonus-section';

jest.mock('../../../hooks/musd/useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useFiatFormatter', () => ({
  useFiatFormatter: () => (n: number) => `$${n.toFixed(2)}`,
}));

jest.mock('../../../components/app/musd/hooks/useMerklRewards', () => ({
  useMerklRewards: () => ({
    hasClaimableReward: false,
    rewardAmountFiat: null,
    lifetimeClaimedFiat: 5,
    isLoading: false,
    isEligible: true,
  }),
}));

jest.mock('../../../components/app/musd/hooks/useMerklClaim', () => ({
  useMerklClaim: () => ({
    claimRewards: jest.fn(),
    isClaiming: false,
    error: null,
  }),
}));

jest.mock('../../../selectors/musd', () => {
  const actual = jest.requireActual('../../../selectors/musd');
  return {
    ...actual,
    selectIsMusdConversionFlowEnabled: () => true,
    selectIsMerklClaimingEnabled: () => true,
  };
});

const store = configureMockStore()({});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (key: string, ...args: any[]) =>
  getMessage('en', messages, key, ...args) ?? '';

const renderWithProviders = (component: React.ReactElement) =>
  render(
    <Provider store={store}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <I18nContext.Provider value={t as any}>{component}</I18nContext.Provider>
    </Provider>,
  );

describe('MusdBonusSection', () => {
  it('renders section title and bonus rows', () => {
    renderWithProviders(
      <MusdBonusSection
        chainId="0x1"
        tokenAddress={MUSD_TOKEN_ADDRESS}
        positionFiatValue={1000}
        showFiat
      />,
    );

    expect(screen.getByTestId('musd-bonus-section')).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetBonusTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetBonusEstimatedAnnual.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.musdAssetBonusLifetimeClaimed.message),
    ).toBeInTheDocument();
  });

  it('renders Your bonus info control and opens tooltip content', async () => {
    renderWithProviders(
      <MusdBonusSection
        chainId="0x1"
        tokenAddress={MUSD_TOKEN_ADDRESS}
        positionFiatValue={1000}
        showFiat
      />,
    );

    expect(
      screen.getByTestId('musd-bonus-info-tooltip-button'),
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('musd-bonus-info-tooltip-button'));
    });

    expect(
      screen.getByText(messages.musdAssetBonusInfoLearnMore.message),
    ).toBeInTheDocument();
  });
});
