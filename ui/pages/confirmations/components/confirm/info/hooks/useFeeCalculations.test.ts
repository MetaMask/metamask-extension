import { TransactionMeta } from '@metamask/transaction-controller';
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
        "estimatedFeeNative": "0 ETH",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "< $0.01",
        "maxFeeFiatWith18SignificantDigits": "0",
        "maxFeeNative": "0 ETH",
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
        "estimatedFeeNative": "0.0001 ETH",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeNative": "0.0001 ETH",
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
        "estimatedFeeNative": "0.0001 ETH",
        "l1FeeFiat": "",
        "l1FeeFiatWith18SignificantDigits": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeFiatWith18SignificantDigits": "",
        "l2FeeNative": "",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeNative": "0.0001 ETH",
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
        "estimatedFeeNative": "0.0046 ETH",
        "l1FeeFiat": "$2.50",
        "l1FeeFiatWith18SignificantDigits": null,
        "l1FeeNative": "0.0045 ETH",
        "l2FeeFiat": "$0.04",
        "l2FeeFiatWith18SignificantDigits": null,
        "l2FeeNative": "0.0001 ETH",
        "maxFeeFiat": "$0.07",
        "maxFeeFiatWith18SignificantDigits": null,
        "maxFeeNative": "0.0001 ETH",
      }
    `);
  });
});
