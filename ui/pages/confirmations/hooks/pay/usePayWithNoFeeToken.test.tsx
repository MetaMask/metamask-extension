import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { type Asset } from '../../types/send';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { MUSD_TOKEN_ADDRESS } from '../../constants/musd';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useTransactionPayingAccount } from '../transactions/useTransactionPayingAccount';
import { usePayWithNoFeeToken } from './usePayWithNoFeeToken';

jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('../transactions/useTransactionPayingAccount');

const ETH_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const ETH_MUSD = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const PAYER_ADDRESS = '0x1111111111111111111111111111111111111111';
const PAYER_ACCOUNT_ID = 'payer-account-id';

const mockStore = configureMockStore();
const useTransactionMetadataRequestOptionalMock = jest.mocked(
  useTransactionMetadataRequestOptional,
);
const useTransactionPayingAccountMock = jest.mocked(
  useTransactionPayingAccount,
);

function renderUsePayWithNoFeeToken(
  remoteFeatureFlags: Record<string, unknown>,
  payerKeyringType = 'HD Key Tree',
) {
  const store = mockStore({
    metamask: {
      remoteFeatureFlags,
      internalAccounts: {
        accounts: {
          [PAYER_ACCOUNT_ID]: {
            address: PAYER_ADDRESS,
            id: PAYER_ACCOUNT_ID,
            metadata: { keyring: { type: payerKeyringType } },
          },
        },
        selectedAccount: PAYER_ACCOUNT_ID,
      },
      accountIdByAddress: { [PAYER_ADDRESS]: PAYER_ACCOUNT_ID },
    },
  });

  return renderHook(() => usePayWithNoFeeToken(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
}

describe('usePayWithNoFeeToken', () => {
  beforeEach(() => {
    useTransactionMetadataRequestOptionalMock.mockReturnValue(undefined);
    useTransactionPayingAccountMock.mockReturnValue(PAYER_ADDRESS);
  });

  describe('hardware payer', () => {
    const SUBSIDISED_FLAGS = {
      /* eslint-disable @typescript-eslint/naming-convention */
      confirmations_relay_fixed_spread: {
        chains: { eth: '0x1' },
        tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
        routes: [['eth', 'eth_usdc', 'eth', 'musd']],
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    };

    it('treats no token as no-fee when the payer is a hardware wallet', () => {
      const { result } = renderUsePayWithNoFeeToken(
        SUBSIDISED_FLAGS,
        'Ledger Hardware',
      );

      expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(false);
      expect(
        result.current.isNoFeeToken(MUSD_TOKEN_ADDRESS, CHAIN_IDS.MONAD),
      ).toBe(false);
    });

    it('renders no tag when the payer is a hardware wallet', () => {
      const { result } = renderUsePayWithNoFeeToken(
        SUBSIDISED_FLAGS,
        'Ledger Hardware',
      );

      expect(
        result.current.renderNoFeeTag({
          address: ETH_USDC,
          chainId: '0x1',
          symbol: 'USDC',
        } as Asset),
      ).toBeNull();
    });

    it('keeps no-fee tokens for a software payer', () => {
      const { result } = renderUsePayWithNoFeeToken(SUBSIDISED_FLAGS);

      expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(true);
    });

    it('keeps no-fee tokens when the payer is unknown', () => {
      useTransactionPayingAccountMock.mockReturnValue(undefined);
      const { result } = renderUsePayWithNoFeeToken(SUBSIDISED_FLAGS);

      expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(true);
    });
  });

  it('returns false when the relay fixed-spread flag is empty', () => {
    const { result } = renderUsePayWithNoFeeToken({});

    expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(false);
  });

  it('returns true for a subsidised source token', () => {
    const { result } = renderUsePayWithNoFeeToken({
      /* eslint-disable @typescript-eslint/naming-convention */
      confirmations_relay_fixed_spread: {
        chains: { eth: '0x1' },
        tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
        routes: [['eth', 'eth_usdc', 'eth', 'musd']],
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(true);
    expect(result.current.isNoFeeToken(ETH_MUSD, '0x1')).toBe(false);
  });

  it('renders a No fee tag for subsidised source tokens', () => {
    const { result } = renderUsePayWithNoFeeToken({
      /* eslint-disable @typescript-eslint/naming-convention */
      confirmations_relay_fixed_spread: {
        chains: { eth: '0x1' },
        tokens: { eth_usdc: ETH_USDC, musd: ETH_MUSD },
        routes: [['eth', 'eth_usdc', 'eth', 'musd']],
      },
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    const tagged = result.current.renderNoFeeTag({
      address: ETH_USDC,
      chainId: '0x1',
      symbol: 'USDC',
    } as Asset);
    const untagged = result.current.renderNoFeeTag({
      address: ETH_MUSD,
      chainId: '0x1',
      symbol: 'MUSD',
    } as Asset);

    expect(tagged).not.toBeNull();
    expect(untagged).toBeNull();
  });

  it('tags Monad mUSD itself even when the flag omits the same-token route', () => {
    const { result } = renderUsePayWithNoFeeToken({});

    expect(
      result.current.isNoFeeToken(MUSD_TOKEN_ADDRESS, CHAIN_IDS.MONAD),
    ).toBe(true);
    expect(result.current.isNoFeeToken(ETH_USDC, CHAIN_IDS.MONAD)).toBe(false);
  });

  it('renders a No fee tag for Monad mUSD', () => {
    const { result } = renderUsePayWithNoFeeToken({});

    const tagged = result.current.renderNoFeeTag({
      address: MUSD_TOKEN_ADDRESS,
      chainId: CHAIN_IDS.MONAD,
      symbol: 'mUSD',
    } as Asset);

    expect(tagged).not.toBeNull();
  });

  describe('Money Account withdrawal — directional no-fee', () => {
    const ethDest = '0xdddddddddddddddddddddddddddddddddddddddd';

    beforeEach(() => {
      useTransactionMetadataRequestOptionalMock.mockReturnValue({
        type: TransactionType.moneyAccountWithdraw,
      } as TransactionMeta);
    });

    it('tags a token that is the destination of a Monad mUSD route', () => {
      const { result } = renderUsePayWithNoFeeToken({
        /* eslint-disable @typescript-eslint/naming-convention */
        confirmations_relay_fixed_spread: {
          chains: { eth: '0x1', monad: CHAIN_IDS.MONAD },
          tokens: { eth_dest: ethDest, musd: MUSD_TOKEN_ADDRESS },
          routes: [['monad', 'musd', 'eth', 'eth_dest']],
        },
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      expect(result.current.isNoFeeToken(ethDest, '0x1')).toBe(true);
    });

    it('does not tag a deposit-only subsidised source', () => {
      const { result } = renderUsePayWithNoFeeToken({
        /* eslint-disable @typescript-eslint/naming-convention */
        confirmations_relay_fixed_spread: {
          chains: { eth: '0x1', monad: CHAIN_IDS.MONAD },
          tokens: { eth_usdc: ETH_USDC, musd: MUSD_TOKEN_ADDRESS },
          routes: [['eth', 'eth_usdc', 'monad', 'musd']],
        },
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      expect(result.current.isNoFeeToken(ETH_USDC, '0x1')).toBe(false);
    });

    it('tags Monad mUSD itself even though the flag omits the same-token route', () => {
      const { result } = renderUsePayWithNoFeeToken({});

      expect(
        result.current.isNoFeeToken(MUSD_TOKEN_ADDRESS, CHAIN_IDS.MONAD),
      ).toBe(true);
    });
  });
});
