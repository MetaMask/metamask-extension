import nock from 'nock';

import { setSwapsLiveness } from '../../store/actions';
import { setStorageItem } from '../../../lib/storage-helpers';
import {
  ETH_SYMBOL,
  WETH_SYMBOL,
  MAINNET_CHAIN_ID,
  BSC_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
} from '../../../../shared/constants/network';
import {
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  ETH_WETH_CONTRACT_ADDRESS,
} from '../../../../shared/constants/swaps';
import * as swaps from './swaps';

jest.mock('../../store/actions.js', () => ({
  setSwapsLiveness: jest.fn(),
}));

const providerState = {
  chainId: '0x1',
  nickname: '',
  rpcPrefs: {},
  rpcUrl: '',
  ticker: 'ETH',
  type: 'mainnet',
};

describe('Ducks - Swaps', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchSwapsLiveness', () => {
    const cleanFeatureFlagApiCache = () => {
      setStorageItem(
        'cachedFetch:https://api.metaswap.codefi.network/featureFlag',
        null,
      );
    };

    afterEach(() => {
      cleanFeatureFlagApiCache();
    });

    const mockFeatureFlagApiResponse = ({
      active = false,
      replyWithError = false,
    } = {}) => {
      const apiNock = nock('https://api.metaswap.codefi.network').get(
        '/featureFlag',
      );
      if (replyWithError) {
        return apiNock.replyWithError({
          message: 'Server error. Try again later',
          code: 'serverSideError',
        });
      }
      return apiNock.reply(200, {
        active,
      });
    };

    const createGetState = () => {
      return () => ({
        metamask: { provider: { ...providerState } },
      });
    };

    it('returns true if the Swaps feature is enabled', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({ active: true });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(true);
      expect(isSwapsFeatureEnabled).toBe(true);
    });

    it('returns false if the Swaps feature is disabled', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({ active: false });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(false);
      expect(isSwapsFeatureEnabled).toBe(false);
    });

    it('returns false if the /featureFlag API call throws an error', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({
        replyWithError: true,
      });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(false);
      expect(isSwapsFeatureEnabled).toBe(false);
    });

    it('only calls the API once and returns true from cache for the second call', async () => {
      const mockDispatch = jest.fn();
      const featureFlagApiNock = mockFeatureFlagApiResponse({ active: true });
      await swaps.fetchSwapsLiveness()(mockDispatch, createGetState());
      expect(featureFlagApiNock.isDone()).toBe(true);
      const featureFlagApiNock2 = mockFeatureFlagApiResponse({ active: true });
      const isSwapsFeatureEnabled = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock2.isDone()).toBe(false); // Second API call wasn't made, cache was used instead.
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(setSwapsLiveness).toHaveBeenCalledWith(true);
      expect(isSwapsFeatureEnabled).toBe(true);
    });
  });

  describe('isContractAddressValid', () => {
    const { isContractAddressValid } = swaps.testables;
    let swapMetaData;
    let usedTradeTxParams;

    beforeEach(() => {
      swapMetaData = {
        available_quotes: undefined,
        average_savings: undefined,
        best_quote_source: 'paraswap',
        custom_slippage: true,
        estimated_gas: '134629',
        fee_savings: undefined,
        gas_fees: '47.411896',
        median_metamask_fee: undefined,
        other_quote_selected: false,
        other_quote_selected_source: '',
        performance_savings: undefined,
        slippage: 5,
        suggested_gas_price: '164',
        token_from: ETH_SYMBOL,
        token_from_amount: '1',
        token_to: WETH_SYMBOL,
        token_to_amount: '1.0000000',
        used_gas_price: '164',
      };
      usedTradeTxParams = {
        data: 'testData',
        from: '0xe53a5bc256898bfa5673b20aceeb2b2152075d17',
        gas: '2427c',
        gasPrice: '27592f5a00',
        to: ETH_WETH_CONTRACT_ADDRESS,
        value: '0xde0b6b3a7640000',
      };
    });

    it('returns true if "token_from" is ETH, "token_to" is WETH and "to" is ETH_WETH contract address', () => {
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          MAINNET_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns true if "token_from" is WETH, "token_to" is ETH and "to" is ETH_WETH contract address', () => {
      swapMetaData.token_from = WETH_SYMBOL;
      swapMetaData.token_to = ETH_SYMBOL;
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          MAINNET_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns true if "token_from" is ETH, "token_to" is WETH and "to" is ETH_WETH contract address with some uppercase chars', () => {
      usedTradeTxParams.to = '0xc02AAA39B223fe8d0a0e5c4f27ead9083c756cc2';
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          MAINNET_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns false if "token_from" is ETH, "token_to" is WETH and "to" is mainnet contract address', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[MAINNET_CHAIN_ID];
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          MAINNET_CHAIN_ID,
        ),
      ).toBe(false);
    });

    it('returns false if "token_from" is WETH, "token_to" is ETH and "to" is mainnet contract address', () => {
      swapMetaData.token_from = WETH_SYMBOL;
      swapMetaData.token_to = ETH_SYMBOL;
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[MAINNET_CHAIN_ID];
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          MAINNET_CHAIN_ID,
        ),
      ).toBe(false);
    });

    it('returns false if contractAddress is null', () => {
      expect(
        isContractAddressValid(null, swapMetaData, LOCALHOST_CHAIN_ID),
      ).toBe(false);
    });

    it('returns true if "token_from" is BAT and "to" is mainnet contract address', () => {
      swapMetaData.token_from = 'BAT';
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[MAINNET_CHAIN_ID];
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          MAINNET_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns true if "token_to" is BAT and "to" is BSC contract address', () => {
      swapMetaData.token_to = 'BAT';
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[BSC_CHAIN_ID];
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          BSC_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns true if "token_to" is BAT and "to" is testnet contract address', () => {
      swapMetaData.token_to = 'BAT';
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[LOCALHOST_CHAIN_ID];
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          LOCALHOST_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns true if "token_to" is BAT and "to" is testnet contract address with some uppercase chars', () => {
      swapMetaData.token_to = 'BAT';
      usedTradeTxParams.to = '0x881D40237659C251811CEC9c364ef91dC08D300C';
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          LOCALHOST_CHAIN_ID,
        ),
      ).toBe(true);
    });

    it('returns false if "token_to" is BAT and "to" has mismatch with current chainId', () => {
      swapMetaData.token_to = 'BAT';
      expect(
        isContractAddressValid(
          usedTradeTxParams.to,
          swapMetaData,
          LOCALHOST_CHAIN_ID,
        ),
      ).toBe(false);
    });
  });
});
