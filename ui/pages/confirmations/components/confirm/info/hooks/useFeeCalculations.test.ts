import { toHex } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { merge } from 'lodash';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
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

  it('picks up gasLimitNoBuffer for estimations', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    // txParams.gas is 0xab77 or 43895 in decimals
    transactionMeta.gasLimitNoBuffer = toHex(39799);

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    // The following assertions are meant as a snapshot test. These are
    // currently unavailable after the prettier upgrade to v3, so I'm asserting
    // each property individually instead.
    expect(result.current.estimatedFeeFiat).toBe('$0.03');
    expect(result.current.estimatedFeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.estimatedFeeNative).toBe('0.0001');
    expect(result.current.estimatedFeeNativeHex).toBe('0x364ba3e2d900');
    expect(result.current.l1FeeFiat).toBe('');
    expect(result.current.l1FeeFiatWith18SignificantDigits).toBe('');
    expect(result.current.l1FeeNative).toBe('');
    expect(result.current.l2FeeFiat).toBe('');
    expect(result.current.l2FeeFiatWith18SignificantDigits).toBe('');
    expect(result.current.l2FeeNative).toBe('');
    expect(result.current.maxFeeFiat).toBe('$0.06');
    expect(result.current.maxFeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.maxFeeNative).toBe('0.0001');
  });

  it('picks up gasUsed for network fee on estimations', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;

    // txParams.gas is 0xab77 or 43895 in decimals
    // gas used is lower than the gasLimitNoBuffer in the test above
    // so the estimates should be lower
    transactionMeta.gasUsed = toHex(37000);

    const { result } = renderHookWithProvider(
      () => useFeeCalculations(transactionMeta),
      mockState,
    );

    // The following assertions are meant as a snapshot test. These are
    // currently unavailable after the prettier upgrade to v3, so I'm asserting
    // each property individually instead.
    expect(result.current.estimatedFeeFiat).toBe('$0.03');
    expect(result.current.estimatedFeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.estimatedFeeNative).toBe('0.0001');
    expect(result.current.estimatedFeeNativeHex).toBe('0x327a19c8f800');
    expect(result.current.l1FeeFiat).toBe('');
    expect(result.current.l1FeeFiatWith18SignificantDigits).toBe('');
    expect(result.current.l1FeeNative).toBe('');
    expect(result.current.l2FeeFiat).toBe('');
    expect(result.current.l2FeeFiatWith18SignificantDigits).toBe('');
    expect(result.current.l2FeeNative).toBe('');
    expect(result.current.maxFeeFiat).toBe('$0.06');
    expect(result.current.maxFeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.maxFeeNative).toBe('0.0001');
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

    // The following assertions are meant as a snapshot test. These are
    // currently unavailable after the prettier upgrade to v3, so I'm asserting
    // each property individually instead.
    expect(result.current.estimatedFeeFiat).toBe('$2.54');
    expect(result.current.estimatedFeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.estimatedFeeNative).toBe('0.0046');
    expect(result.current.estimatedFeeNativeHex).toBe('0x103be226d2d900');
    expect(result.current.l1FeeFiat).toBe('$2.50');
    expect(result.current.l1FeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.l1FeeNative).toBe('0.0045');
    expect(result.current.l2FeeFiat).toBe('$0.04');
    expect(result.current.l2FeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.l2FeeNative).toBe('0.0001');
    expect(result.current.maxFeeFiat).toBe('$2.57');
    expect(result.current.maxFeeFiatWith18SignificantDigits).toBe(null);
    expect(result.current.maxFeeNative).toBe('0.0046');
  });
});
