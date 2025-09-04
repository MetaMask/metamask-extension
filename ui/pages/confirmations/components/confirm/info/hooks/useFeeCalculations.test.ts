import { merge } from 'lodash';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { useFeeCalculations } from './useFeeCalculations';

describe('useFeeCalculations', () => {
  it('returns no estimates for empty txParams', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () =>
        useFeeCalculations({ ...transactionMeta, txParams: { from: '0x' } }),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "estimatedFeeFiat": "< $0.01",
        "estimatedFeeFiatWith18SignificantDigits": "0",
        "estimatedFeeNative": "0",
        "estimatedFeeNativeHex": "0x0",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "< $0.01",
        "maxFeeFiatWith18SignificantDigits": "0",
        "maxFeeNative": "0",
      }
    `);
  });

  it('returns the correct estimate for a transaction', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "estimatedFeeFiat": "$0.04",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x3be226d2d900",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
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

    const { result: resultOnBNB } = renderHookWithProvider(
      () => useFeeCalculations(transactionOnBNB),
      mockStateWithBNBNetwork,
    );

    expect(resultOnBNB.current).toMatchInlineSnapshot(`
      {
        "estimatedFeeFiat": "< $0.01",
        "estimatedFeeFiatWith18SignificantDigits": "0.000065843",
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x3be226d2d900",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "< $0.01",
        "maxFeeFiatWith18SignificantDigits": "0.000125347",
        "maxFeeNative": "0.0001",
      }
    `);
  });

  it('picks up gasLimitNoBuffer for minimum network fee on estimations', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    // txParams.gas is 0xab77
    transactionMeta.gasLimitNoBuffer = '0x9b77';

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "estimatedFeeFiat": "$0.03",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0001",
        "estimatedFeeNativeHex": "0x364ba3e2d900",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeNative": "0.0001",
      }
    `);
  });

  it('returns the correct estimate for a transaction with layer1GasFee', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    transactionMeta.layer1GasFee = '0x10000000000000';

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "estimatedFeeFiat": "$2.54",
        "estimatedFeeFiatWith18SignificantDigits": null,
        "estimatedFeeNative": "0.0046",
        "estimatedFeeNativeHex": "0x103be226d2d900",
        "l1FeeFiat": "$2.50",
        "l1FeeFiatWith18SignificantDigits": null,
        "l1FeeNative": "0.0045",
        "l2FeeFiat": "$0.04",
        "l2FeeFiatWith18SignificantDigits": null,
        "l2FeeNative": "0.0001",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeNative": "0.0001",
      }
    `);
  });
});
