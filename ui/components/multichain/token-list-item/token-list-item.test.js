import React from 'react';
import configureMockStore from 'redux-mock-store';

import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { mockNetworkState } from '../../../../test/stub/networks';
import { TokenListItem } from '.';

const state = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    useTokenDetection: false,
    currencyRates: {},
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: false,
    },
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
  },
};

let openTabSpy;

jest.mock('../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

const mockGetIntlLocale = getIntlLocale;

describe('TokenListItem', () => {
  beforeAll(() => {
    global.platform = { openTab: jest.fn() };
    openTabSpy = jest.spyOn(global.platform, 'openTab');
    mockGetIntlLocale.mockReturnValue('en-US');
  });
  const props = {
    onClick: jest.fn(),
  };
  it('should render correctly', () => {
    const store = configureMockStore()(state);
    const { getByTestId, container } = renderWithProvider(
      // eslint-disable-next-line no-empty-function
      <TokenListItem onClick={() => {}} />,
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

  it('should render crypto balance with warning scam', () => {
    const store = configureMockStore()(state);
    const propsToUse = {
      primary: '11.9751 ETH',
      isNativeCurrency: true,
      isOriginalTokenSymbol: false,
    };
    const { getByText } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );
    expect(getByText('11.9751 ETH')).toBeInTheDocument();
  });

  it('should display warning scam modal', () => {
    const store = configureMockStore()(state);
    const propsToUse = {
      primary: '11.9751 ETH',
      isNativeCurrency: true,
      isOriginalTokenSymbol: false,
      showPercentage: true,
    };
    const { getByTestId, getByText } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );

    const warningScamModal = getByTestId('scam-warning');
    fireEvent.click(warningScamModal);

    expect(getByText('This is a potential scam')).toBeInTheDocument();
  });

  it('should render crypto balance if useNativeCurrencyAsPrimaryCurrency is false', () => {
    const store = configureMockStore()({
      ...state,
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: false,
      },
    });
    const propsToUse = {
      primary: '11.9751 ETH',
      isNativeCurrency: true,
      isOriginalTokenSymbol: false,
    };

    const { getByText } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );
    expect(getByText('11.9751 ETH')).toBeInTheDocument();
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
