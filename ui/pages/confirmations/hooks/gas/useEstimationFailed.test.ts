import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';

import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { useEstimationFailed } from './useEstimationFailed';

jest.mock('../../../../../shared/modules/selectors');
jest.mock('../../../../store/controller-actions/transaction-controller');

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

function runHook(confirmation: TransactionMeta) {
  const { result } = renderHookWithConfirmContextProvider(
    useEstimationFailed,
    getMockConfirmStateForTransaction(confirmation),
  );

  return result.current;
}

describe('useEstimationFailed', () => {
  it('returns false when simulationFails is undefined', () => {
    const result = runHook({
      ...CONFIRMATION_MOCK,
      simulationFails: undefined,
    });

    expect(result).toBe(false);
  });

  it('returns false when simulationFails is undefined and userFeeLevel is CUSTOM', () => {
    const result = runHook({
      ...CONFIRMATION_MOCK,
      simulationFails: undefined,
      userFeeLevel: UserFeeLevel.CUSTOM,
    });

    expect(result).toBe(false);
  });

  it('returns true when simulationFails is truthy and userFeeLevel is not CUSTOM', () => {
    const result = runHook({
      ...CONFIRMATION_MOCK,
      simulationFails: { debug: {} },
      userFeeLevel: UserFeeLevel.MEDIUM,
    } as TransactionMeta);

    expect(result).toBe(true);
  });

  it('returns false when simulationFails is truthy but userFeeLevel is CUSTOM', () => {
    const result = runHook({
      ...CONFIRMATION_MOCK,
      simulationFails: { debug: {} },
      userFeeLevel: UserFeeLevel.CUSTOM,
    } as TransactionMeta);

    expect(result).toBe(false);
  });

  it('returns true when simulationFails is truthy and userFeeLevel is DAPP_SUGGESTED', () => {
    const result = runHook({
      ...CONFIRMATION_MOCK,
      simulationFails: { debug: {} },
      userFeeLevel: UserFeeLevel.DAPP_SUGGESTED,
    } as TransactionMeta);

    expect(result).toBe(true);
  });
});
