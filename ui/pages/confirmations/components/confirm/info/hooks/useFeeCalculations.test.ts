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
        "estimatedFiatFee": "$0.00",
        "estimatedNativeFee": "0 WEI",
        "l1FiatFee": "",
        "l1NativeFee": "",
        "l2FiatFee": "",
        "l2NativeFee": "",
        "maxFiatFee": "$0.00",
        "maxNativeFee": "0 WEI",
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
        "estimatedFiatFee": "$2.20",
        "estimatedNativeFee": "0.004 ETH",
        "l1FiatFee": "",
        "l1NativeFee": "",
        "l2FiatFee": "",
        "l2NativeFee": "",
        "maxFiatFee": "$4.23",
        "maxNativeFee": "0.0076 ETH",
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
        "estimatedFiatFee": "$2.54",
        "estimatedNativeFee": "0.0046 ETH",
        "l1FiatFee": "$2.50",
        "l1NativeFee": "0.0045 ETH",
        "l2FiatFee": "$0.04",
        "l2NativeFee": "0.0001 ETH",
        "maxFiatFee": "$4.23",
        "maxNativeFee": "0.0076 ETH",
      }
    `);
  });
});
