import React from 'react';
import configureMockStore from 'redux-mock-store';

import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import { TokenListItem } from '.';

const state = {
  metamask: {
    providerConfig: {
      ticker: CURRENCY_SYMBOLS.ETH,
      nickname: '',
      chainId: CHAIN_IDS.MAINNET,
      type: NETWORK_TYPES.MAINNET,
    },
    useTokenDetection: false,
    currencyRates: {},
  },
};

let openTabSpy;

describe('TokenListItem', () => {
  beforeAll(() => {
    global.platform = { openTab: jest.fn() };
    openTabSpy = jest.spyOn(global.platform, 'openTab');
  });
  const props = {
    onClick: jest.fn(),
  };
  it('should render correctly', () => {
    const store = configureMockStore()(state);
    const { getByTestId, container } = renderWithProvider(
      <TokenListItem />,
      store,
    );
    expect(getByTestId('multichain-token-list-item')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render with custom className', () => {
    const store = configureMockStore()(state);
    const { getByTestId } = renderWithProvider(
      <TokenListItem className="multichain-token-list-item-test" />,
      store,
    );
    expect(getByTestId('multichain-token-list-item')).toHaveClass(
      'multichain-token-list-item-test',
    );
  });

  it('handles click action and fires onClick', () => {
    const store = configureMockStore()(state);
    const { queryByTestId } = renderWithProvider(
      <TokenListItem {...props} />,
      store,
    );

    fireEvent.click(queryByTestId('multichain-token-list-button'));

    expect(props.onClick).toHaveBeenCalled();
  });

  it('handles clicking staking opens tab', async () => {
    const store = configureMockStore()(state);
    const { queryByTestId } = renderWithProvider(
      <TokenListItem isStakeable {...props} />,
      store,
    );

    const stakeButton = queryByTestId(
      `staking-entrypoint-${CHAIN_IDS.MAINNET}`,
    );

    expect(stakeButton).toBeInTheDocument();
    expect(stakeButton).not.toBeDisabled();

    fireEvent.click(stakeButton);
    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining('/stake?metamaskEntry=ext_stake_button'),
      }),
    );
  });
});
