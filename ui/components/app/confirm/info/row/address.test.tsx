import React from 'react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { shortenAddress } from '../../../../../helpers/utils/util';
import configureStore from '../../../../../store/store';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import { ConfirmInfoRowAddress } from './address';
import { TEST_ADDRESS } from './constants';

const render = (
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storeOverrides: Record<string, any> = {},
  address: string = TEST_ADDRESS,
) => {
  const store = configureStore({
    metamask: { ...mockState.metamask },
    ...storeOverrides,
  });

  return renderWithProvider(<ConfirmInfoRowAddress address={address} />, store);
};

describe('ConfirmInfoRowAddress', () => {
  it('renders appropriately with PetNames enabled', () => {
    const { container } = render({
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          petnamesEnabled: true,
        },
      },
    });

    expect(container).toMatchSnapshot();
  });

  describe('renders appropriately with PetNames disabled', () => {
    it('with an internal account name', () => {
      const testAccountName = 'Account 1';

      const { container, getByTestId } = render({
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            petnamesEnabled: false,
          },
          internalAccounts: {
            accounts: {
              'test address': {
                address: TEST_ADDRESS,
                metadata: {
                  name: testAccountName,
                },
              },
            },
          },
        },
      });

      expect(getByTestId('confirm-info-row-display-name').textContent).toEqual(
        testAccountName,
      );

      expect(container).toMatchSnapshot();
    });

    it('with an address book contact', () => {
      const testAddressBookName = 'Test address book name';

      const { container, getByTestId } = render({
        metamask: {
          ...mockState.metamask,
          preferences: {
            ...mockState.metamask.preferences,
            petnamesEnabled: false,
          },
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          addressBook: {
            [CHAIN_IDS.MAINNET]: {
              [TEST_ADDRESS]: {
                address: TEST_ADDRESS,
                name: testAddressBookName,
              },
            },
          },
        },
      });

      expect(getByTestId('confirm-info-row-display-name').textContent).toEqual(
        testAddressBookName,
      );

      expect(container).toMatchSnapshot();
    });

    it('with a name from the contract metadata', () => {
      const WBTC = Object.freeze({
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        name: 'Wrapped Bitcoin',
      });

      const { container, getByTestId } = render(
        {
          metamask: {
            ...mockState.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
            tokenList: {
              [WBTC.address]: {
                address: WBTC.address,
                symbol: 'WBTC',
                decimals: 8,
                name: WBTC.name,
                iconUrl:
                  'https://s3.amazonaws.com/airswap-token-images/WBTC.png',
                aggregators: [Array],
                occurrences: 12,
              },
            },
          },
        },
        WBTC.address,
      );

      expect(getByTestId('confirm-info-row-display-name').textContent).toEqual(
        WBTC.name,
      );

      expect(container).toMatchSnapshot();
    });

    it('with a name from the ENS resolution ', () => {
      const testENSName = 'Test ENS Name';

      const { container, getByTestId } = render({
        metamask: {
          ...mockState.metamask,
          ensResolutionsByAddress: {
            [TEST_ADDRESS]: testENSName,
          },
        },
      });

      expect(getByTestId('confirm-info-row-display-name').textContent).toEqual(
        testENSName,
      );

      expect(container).toMatchSnapshot();
    });

    it('with a shortened address', () => {
      const { container, getByTestId } = render({
        metamask: { ...mockState.metamask },
      });

      expect(getByTestId('confirm-info-row-display-name').textContent).toEqual(
        shortenAddress(TEST_ADDRESS),
      );

      expect(container).toMatchSnapshot();
    });
  });
});
