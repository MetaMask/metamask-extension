import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { mockNetworkState } from '../../../../test/stub/networks';
import {
  getCurrencyRates,
  getNetworkConfigurationIdByChainId,
} from '../../../selectors';
import { getMultichainIsEvm } from '../../../selectors/multichain';
import { TokenListItem } from '.';

const state = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    useTokenDetection: false,
    currencyRates: {},
    preferences: {},
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

let openTabSpy: jest.SpyInstance<void, [opts: { url: string }], unknown>;

jest.mock('../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const mockGetIntlLocale = getIntlLocale;

describe('TokenListItem', () => {
  beforeAll(() => {
    // @ts-expect-error mocking platform
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };
    // @ts-expect-error mocking platform
    openTabSpy = jest.spyOn(global.platform, 'openTab');
    (mockGetIntlLocale as unknown as jest.Mock).mockReturnValue('en-US');
  });
  const props = {
    onClick: jest.fn(),
    tokenImage: '',
    title: '',
    chainId: '0x1',
    tokenChainImage: './eth-logo.png',
  };
  it('should render correctly', () => {
    const store = configureMockStore()(state);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getNetworkConfigurationIdByChainId) {
        return '0x1';
      }
      if (selector === getMultichainIsEvm) {
        return true;
      }
      return undefined;
    });
    const { getByTestId, container } = renderWithProvider(
      <TokenListItem {...props} />,
      store,
    );
    expect(getByTestId('multichain-token-list-item')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render with custom className', () => {
    const store = configureMockStore()(state);
    const { getByTestId } = renderWithProvider(
      <TokenListItem className="multichain-token-list-item-test" {...props} />,
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
      tokenImage: '',
      title: '',
      chainId: '0x1',
    };
    const { getByText, container } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );
    expect(getByText('11.9751 ETH')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('should display warning scam modal', () => {
    const store = configureMockStore()(state);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getCurrencyRates) {
        return { ETH: '' };
      }
      if (selector === getMultichainIsEvm) {
        return true;
      }
      return undefined;
    });
    const propsToUse = {
      primary: '11.9751 ETH',
      isNativeCurrency: true,
      isOriginalTokenSymbol: false,
      showPercentage: true,
      tokenImage: '',
      title: '',
      tokenSymbol: 'SCAM_TOKEN',
      chainId: '0x1',
      nativeCurrencySymbol: 'ETH',
    };
    const { getByTestId, getByText, container } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );
    expect(container).toMatchSnapshot();

    const warningScamModal = getByTestId('scam-warning');
    fireEvent.click(warningScamModal);

    expect(
      getByText(
        'The native token symbol does not match the expected symbol of the native token for the network with the associated chain ID. You have entered SCAM_TOKEN while the expected token symbol is ETH. Please verify you are connected to the correct chain.',
      ),
    ).toBeInTheDocument();
  });

  it('should display warning scam modal fallback when safechains fails to resolve correctly', () => {
    const store = configureMockStore()(state);
    const propsToUse = {
      primary: '11.9751 ETH',
      isNativeCurrency: true,
      isOriginalTokenSymbol: false,
      showPercentage: true,
      tokenImage: '',
      title: '',
      tokenSymbol: 'SCAM_TOKEN',
      chainId: '0x1',
      nativeCurrencySymbol: undefined,
    };
    const { getByTestId, getByText, container } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );

    expect(container).toMatchSnapshot();
    const warningScamModal = getByTestId('scam-warning');
    fireEvent.click(warningScamModal);

    expect(
      getByText(
        'The native token symbol does not match the expected symbol of the native token for the network with the associated chain ID. You have entered SCAM_TOKEN while the expected token symbol is something else. Please verify you are connected to the correct chain.',
      ),
    ).toBeInTheDocument();
  });

  it('should render crypto balance', () => {
    const store = configureMockStore()({
      ...state,
      preferences: {},
    });
    const propsToUse = {
      primary: '11.9751 ETH',
      isNativeCurrency: true,
      isOriginalTokenSymbol: false,
      tokenImage: '',
      title: '',
      chainId: '0x1',
    };

    const { getByText, container } = renderWithProvider(
      <TokenListItem {...propsToUse} />,
      store,
    );
    expect(getByText('11.9751 ETH')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('handles click action and fires onClick', () => {
    const store = configureMockStore()(state);
    const { queryByTestId } = renderWithProvider(
      <TokenListItem {...props} tokenImage="" title="" />,
      store,
    );

    const targetElem = queryByTestId('multichain-token-list-button');

    targetElem && fireEvent.click(targetElem);

    expect(props.onClick).toHaveBeenCalled();
  });

  it('handles clicking staking opens tab', async () => {
    const store = configureMockStore()(state);
    const { queryByTestId, container } = renderWithProvider(
      <TokenListItem isStakeable {...props} />,
      store,
    );

    const stakeButton = queryByTestId(
      `staking-entrypoint-${CHAIN_IDS.MAINNET}`,
    );

    expect(stakeButton).toBeInTheDocument();
    expect(stakeButton).not.toBeDisabled();
    expect(container).toMatchSnapshot();

    stakeButton && fireEvent.click(stakeButton);
    expect(openTabSpy).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining('/stake?metamaskEntry=ext_stake_button'),
      }),
    );
  });
});
