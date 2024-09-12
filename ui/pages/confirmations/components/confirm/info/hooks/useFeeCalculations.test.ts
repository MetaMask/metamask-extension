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
        "estimatedFeeFiat": "$0.00",
        "estimatedFeeNative": "0 WEI",
        "l1FeeFiat": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeNative": "",
        "maxFeeFiat": "$0.00",
        "maxFeeNative": "0 WEI",
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
        "estimatedFeeFiat": "$2.20",
        "estimatedFeeNative": "0.004 ETH",
        "l1FeeFiat": "",
        "l1FeeNative": "",
        "l2FeeFiat": "",
        "l2FeeNative": "",
        "maxFeeFiat": "$4.23",
        "maxFeeNative": "0.0076 ETH",
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
        "estimatedFeeNative": "0.0046 ETH",
        "l1FeeFiat": "$2.50",
        "l1FeeNative": "0.0045 ETH",
        "l2FeeFiat": "$0.04",
        "l2FeeNative": "0.0001 ETH",
        "maxFeeFiat": "$4.23",
        "maxFeeNative": "0.0076 ETH",
      }
    `);
  });
});
