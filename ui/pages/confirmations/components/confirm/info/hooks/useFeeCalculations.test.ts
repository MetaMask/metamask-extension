import { toHex } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { QuoteResponse } from '@metamask/bridge-controller';
import { merge } from 'lodash';

import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
  mockBridgeQuotes,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import mockState from '../../../../../../../test/data/mock-state.json';
import * as DappSwapContext from '../../../../context/dapp-swap';
import { useFeeCalculations } from './useFeeCalculations';

describe('useFeeCalculations', () => {
  it('returns no estimates for empty txParams', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () =>
        useFeeCalculations({ ...transactionMeta, txParams: { from: '0x' } }),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "< $0.01",
        "estimatedFeeFiatWith18SignificantDigits": "0",
        "estimatedFeeNative": "0",
        "estimatedFeeNativeHex": "0x0",
        "maxFeeFiat": "< $0.01",
        "maxFeeFiatWith18SignificantDigits": "0",
        "maxFeeHex": "0x0",
        "maxFeeNative": "0",
      }
    `);
  });

  it('returns the correct estimate for a transaction', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "$0.07",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x720087dcfc95",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeHex": "0x720087dcfc95",
        "maxFeeNative": "0.0001",
      }
    `);

    const mockStateWithBNBNetwork = merge({}, mockState, {
      metamask: {
        networkConfigurationsByChainId: {
          '0x38': {
            chainId: '0x38',
            name: 'BNB Smart Chain',
            nativeCurrency: 'BNB',
            defaultRpcEndpointIndex: 0,
            ticker: 'BNB',
            rpcEndpoints: [
              {
                type: 'custom',
                url: 'https://bsc-rpc.com',
                networkClientId: 'bsc-test',
              },
            ],
            blockExplorerUrls: [],
          },
        },
      },
    });

    const transactionOnBNB = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      chainId: '0x38',
    }) as TransactionMeta;

    const { result: resultOnBNB } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionOnBNB),
      mockStateWithBNBNetwork,
    );

    expect(resultOnBNB.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x720087dcfc95",
        "maxFeeFiat": "",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeHex": "0x720087dcfc95",
        "maxFeeNative": "0.0001",
      }
    `);
  });

  it('picks up gasLimitNoBuffer for estimations', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    // txParams.gas is 0xab77 or 43895 in decimals
    transactionMeta.gasLimitNoBuffer = toHex(39799);

    const { result } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "$0.06",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x675d37a7cc95",
        "maxFeeFiat": "$0.06",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeHex": "0x675d37a7cc95",
        "maxFeeNative": "0.0001",
      }
    `);
  });

  it('picks up gasUsed for network fee on estimations', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    // txParams.gas is 0xab77 or 43895 in decimals
    // gas used is lower than the gasLimitNoBuffer in the test above
    // so the estimates should be lower
    transactionMeta.gasUsed = toHex(37000);

    const { result } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "$0.06",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x60183e087418",
        "maxFeeFiat": "$0.06",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeHex": "0x60183e087418",
        "maxFeeNative": "0.0001",
      }
    `);
  });

  it('returns the correct estimate for a transaction with layer1GasFee', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    transactionMeta.layer1GasFee = '0x10000000000000';

    const { result } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "$2.57",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0046",
        "estimatedFeeNativeHex": "0x10720087dcfc95",
        "maxFeeFiat": "$2.57",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeHex": "0x10720087dcfc95",
        "maxFeeNative": "0.0046",
      }
    `);
  });

  it('displays "< 0.0001" for very small non-zero estimated and max fees', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    transactionMeta.txParams.gas = '0x1';
    transactionMeta.gasLimitNoBuffer = undefined;

    const { result } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current.estimatedFeeNative).toBe('< 0.0001');
    expect(result.current.maxFeeNative).toBe('< 0.0001');
  });

  it('returns the correct estimate if quoted swap is displayed in info', () => {
    jest.spyOn(DappSwapContext, 'useDappSwapContextOptional').mockReturnValue({
      selectedQuote: mockBridgeQuotes[0] as unknown as QuoteResponse,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: jest.fn(),
      isQuotedSwapDisplayedInInfo: true,
      isQuotedSwapPresent: true,
    } as DappSwapContext.DappSwapContextType);
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    transactionMeta.layer1GasFee = '0x10000000000000';

    const { result } = renderHookWithConfirmContextProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "calculateGasEstimate": [Function],
        "estimatedFeeFiat": "$3.24",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0058",
        "estimatedFeeNativeHex": "0x14b264dbe9b842",
        "maxFeeFiat": "$3.24",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeHex": "0x14b264dbe9b842",
        "maxFeeNative": "0.0058",
      }
    `);
  });
});
