import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID,
  MoneyAssetOverviewBalanceApy,
  MoneyAssetOverviewBalanceCta,
  MoneyAssetOverviewBalanceDescription,
} from './money-asset-overview-balance-cta';

const render = (component: React.ReactElement) =>
  renderWithProvider(component, configureStore(mockState));

describe('MoneyAssetOverviewBalanceDescription', () => {
  const props = {
    tokenSymbol: 'USDC',
    apyPercent: 6.2,
    projectedEarnings: '+$74.34',
    privacyMode: false,
    onTooltipOpen: jest.fn(),
  };

  it('renders the projected earnings for the token', () => {
    const { getByTestId } = render(
      <MoneyAssetOverviewBalanceDescription {...props} />,
    );

    expect(
      getByTestId(`${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-description`),
    ).toHaveTextContent(
      'Add your USDC to your Money account and earn up to +$74.34 in one year.',
    );
  });

  it('hides the projected earnings in privacy mode', () => {
    const { getByTestId } = render(
      <MoneyAssetOverviewBalanceDescription {...props} privacyMode />,
    );

    expect(
      getByTestId(
        `${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-earnings-trigger`,
      ),
    ).not.toHaveTextContent('+$74.34');
  });

  it('reports the tooltip opening', async () => {
    const onTooltipOpen = jest.fn();
    const { getByTestId } = render(
      <MoneyAssetOverviewBalanceDescription
        {...props}
        onTooltipOpen={onTooltipOpen}
      />,
    );

    await act(async () => {
      fireEvent.mouseEnter(
        getByTestId(
          `${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-earnings-trigger`,
        ),
      );
    });

    expect(onTooltipOpen).toHaveBeenCalledTimes(1);
  });
});

describe('MoneyAssetOverviewBalanceApy', () => {
  it('renders the APY', () => {
    const { getByTestId } = render(<MoneyAssetOverviewBalanceApy apy="6.2%" />);

    expect(
      getByTestId(`${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-apy`),
    ).toHaveTextContent('Earn 6.2% APY');
  });
});

describe('MoneyAssetOverviewBalanceCta', () => {
  it('calls onStartEarning when clicked', () => {
    const onStartEarning = jest.fn();
    const { getByTestId } = render(
      <MoneyAssetOverviewBalanceCta onStartEarning={onStartEarning} />,
    );

    const button = getByTestId(
      `${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-start-earning`,
    );
    fireEvent.click(button);

    expect(button).toHaveTextContent('Start earning');
    expect(onStartEarning).toHaveBeenCalledTimes(1);
  });
});
