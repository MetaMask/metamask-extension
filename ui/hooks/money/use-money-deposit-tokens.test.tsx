import React from 'react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import { MUSD_TOKEN_ADDRESS } from '../../components/app/musd/constants';
import { useSendTokens } from '../../pages/confirmations/hooks/send/useSendTokens';
import { useIsHardwareWalletAccount } from '../useIsHardwareWalletAccount';
import { useMoneyDepositTokens } from './use-money-deposit-tokens';
import type { MoneyDepositToken } from './money-deposit-token-utils';

jest.mock('../../pages/confirmations/hooks/send/useSendTokens');
jest.mock('../useIsHardwareWalletAccount');

const ETH_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

const SUBSIDISED_FLAGS = {
  /* eslint-disable @typescript-eslint/naming-convention */
  confirmations_relay_fixed_spread: {
    chains: { eth: CHAIN_IDS.MAINNET, monad: CHAIN_IDS.MONAD },
    tokens: { eth_usdc: ETH_USDC, musd: MUSD_TOKEN_ADDRESS },
    routes: [['eth', 'eth_usdc', 'monad', 'musd']],
  },
  /* eslint-enable @typescript-eslint/naming-convention */
};

const ETH_USDC_TOKEN: MoneyDepositToken = {
  address: ETH_USDC as Hex,
  chainId: CHAIN_IDS.MAINNET,
  decimals: 6,
  image: '',
  symbol: 'USDC',
  title: 'USD Coin',
  moneyFiatAmountUsd: 10,
};

const MONAD_MUSD_TOKEN: MoneyDepositToken = {
  address: MUSD_TOKEN_ADDRESS,
  chainId: CHAIN_IDS.MONAD,
  decimals: 6,
  image: '',
  symbol: 'mUSD',
  title: 'MetaMask USD',
  moneyFiatAmountUsd: 10,
};

const mockStore = configureMockStore();
const useSendTokensMock = jest.mocked(useSendTokens);
const useIsHardwareWalletAccountMock = jest.mocked(useIsHardwareWalletAccount);

function renderUseMoneyDepositTokens() {
  const store = mockStore({
    metamask: {
      remoteFeatureFlags: SUBSIDISED_FLAGS,
      currentCurrency: 'usd',
      currencyRates: {},
      networkConfigurationsByChainId: {},
    },
  });

  return renderHook(() => useMoneyDepositTokens(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
}

describe('useMoneyDepositTokens', () => {
  beforeEach(() => {
    useSendTokensMock.mockReturnValue([]);
    useIsHardwareWalletAccountMock.mockReturnValue(false);
  });

  describe('isNoFeeToken', () => {
    it('returns true for subsidised tokens on a software account', () => {
      const { result } = renderUseMoneyDepositTokens();

      expect(result.current.isNoFeeToken(ETH_USDC_TOKEN)).toBe(true);
      expect(result.current.isNoFeeToken(MONAD_MUSD_TOKEN)).toBe(true);
    });

    it('returns false for every token on a hardware account', () => {
      useIsHardwareWalletAccountMock.mockReturnValue(true);

      const { result } = renderUseMoneyDepositTokens();

      expect(result.current.isNoFeeToken(ETH_USDC_TOKEN)).toBe(false);
      expect(result.current.isNoFeeToken(MONAD_MUSD_TOKEN)).toBe(false);
      expect(useIsHardwareWalletAccountMock).toHaveBeenCalledWith();
    });
  });
});
