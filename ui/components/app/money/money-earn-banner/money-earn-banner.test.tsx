import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { useMoneyEarnBanner } from '../../../../hooks/money/use-money-asset-overview-ctas';
import { MUSD_TOKEN_ADDRESS } from '../../musd/constants';
import {
  MONEY_EARN_BANNER_TEST_ID,
  MoneyEarnBanner,
} from './money-earn-banner';

jest.mock('../../../../hooks/money/use-money-asset-overview-ctas', () => ({
  ...jest.requireActual(
    '../../../../hooks/money/use-money-asset-overview-ctas',
  ),
  useMoneyEarnBanner: jest.fn(),
}));

const mockUseMoneyEarnBanner = jest.mocked(useMoneyEarnBanner);

const token = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: '0x1',
  symbol: 'USDC',
  balance: '1000',
  tokenFiatAmount: 1000,
  image: './usdc.svg',
} as const;

const handlers = {
  onBannerClick: jest.fn(),
  onCtaClick: jest.fn(),
  onDismiss: jest.fn(),
};

const renderBanner = (
  bannerToken: React.ComponentProps<typeof MoneyEarnBanner>['token'] = token,
) =>
  renderWithProvider(
    <MoneyEarnBanner token={bannerToken} />,
    configureStore(mockState),
  );

describe('MoneyEarnBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyEarnBanner.mockReturnValue({
      isVisible: true,
      apyPercentFormatted: '6%',
      ...handlers,
    });
  });

  it('renders the APY title, token copy, and CTA', () => {
    const { getByTestId, getByText } = renderBanner();

    expect(getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-title`)).toHaveTextContent(
      'Earn up to 6% APY',
    );
    expect(
      getByText('Add USDC to your Money account—no lockups or minimums.'),
    ).toBeInTheDocument();
    expect(getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-cta`)).toHaveTextContent(
      'Add USDC',
    );
  });

  it('falls back to a title without the APY', () => {
    mockUseMoneyEarnBanner.mockReturnValue({
      isVisible: true,
      apyPercentFormatted: undefined,
      ...handlers,
    });

    const { getByTestId } = renderBanner();

    expect(getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-title`)).toHaveTextContent(
      'Earn with your Money account',
    );
  });

  it('renders nothing when not visible', () => {
    mockUseMoneyEarnBanner.mockReturnValue({
      isVisible: false,
      apyPercentFormatted: '6%',
      ...handlers,
    });

    const { queryByTestId } = renderBanner();

    expect(queryByTestId(MONEY_EARN_BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it('starts a deposit from the banner surface', () => {
    const { getByTestId } = renderBanner();

    fireEvent.click(getByTestId(MONEY_EARN_BANNER_TEST_ID));

    expect(handlers.onBannerClick).toHaveBeenCalledTimes(1);
    expect(handlers.onCtaClick).not.toHaveBeenCalled();
  });

  it('starts a deposit from the CTA without a surface click', () => {
    const { getByTestId } = renderBanner();

    fireEvent.click(getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-cta`));

    expect(handlers.onCtaClick).toHaveBeenCalledTimes(1);
    expect(handlers.onBannerClick).not.toHaveBeenCalled();
  });

  it('hides on dismiss without starting a deposit', () => {
    const { getByTestId, queryByTestId } = renderBanner();

    fireEvent.click(getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-dismiss`));

    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
    expect(handlers.onBannerClick).not.toHaveBeenCalled();
    expect(queryByTestId(MONEY_EARN_BANNER_TEST_ID)).not.toBeInTheDocument();
  });

  it('shows again after remounting, as dismissal is not persisted', () => {
    const { getByTestId, unmount } = renderBanner();
    fireEvent.click(getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-dismiss`));
    unmount();

    const { getByTestId: getByTestIdAfterRemount } = renderBanner();

    expect(
      getByTestIdAfterRemount(MONEY_EARN_BANNER_TEST_ID),
    ).toBeInTheDocument();
  });

  it('uses the stablecoin artwork for a known symbol', () => {
    const { getByTestId } = renderBanner();

    expect(
      getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-source-image`),
    ).toHaveAttribute('src', './images/money-earn-banner-usdc.png');
  });

  it('uses the mUSD artwork by address', () => {
    const { getByTestId } = renderBanner({
      ...token,
      address: MUSD_TOKEN_ADDRESS,
      symbol: 'MUSD',
    });

    expect(
      getByTestId(`${MONEY_EARN_BANNER_TEST_ID}-source-image`),
    ).toHaveAttribute('src', './images/money-earn-banner-musd.png');
  });

  it('falls back to the token avatar for other symbols', () => {
    const { queryByTestId } = renderBanner({ ...token, symbol: 'PYUSD' });

    expect(
      queryByTestId(`${MONEY_EARN_BANNER_TEST_ID}-source-image`),
    ).not.toBeInTheDocument();
  });
});
