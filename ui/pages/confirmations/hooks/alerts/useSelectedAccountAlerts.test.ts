import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { unapprovedPersonalSignMsg } from '../../../../../test/data/confirmations/personal_sign';
import { SignatureRequestType } from '../../types/confirm';
import { useSelectedAccountAlerts } from './useSelectedAccountAlerts';

const expectedAlert = [
  {
    key: 'selectedAccountWarning',
    message:
      'This request is for a different account than the one selected in your wallet. To use another account, connect it to the site.',
    reason: 'Different account selected',
    severity: 'warning',
    field: 'signingInWith',
  },
];

describe('useSelectedAccountAlerts', () => {
  it('returns an empty array when there is no current confirmation', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useSelectedAccountAlerts(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns an alert for signature if signing account is different from selected account', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useSelectedAccountAlerts(),
      getMockPersonalSignConfirmStateForRequest({
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          from: '0x0',
        },
      } as SignatureRequestType),
    );
    expect(result.current).toEqual(expectedAlert);
  });

  it('does not returns an alert for signature if signing account is same as selected account', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useSelectedAccountAlerts(),
      getMockPersonalSignConfirmStateForRequest(
        unapprovedPersonalSignMsg as SignatureRequestType,
      ),
    );
    expect(result.current).toEqual([]);
  });

  it('returns an alert for transaction if signing account is different from selected account', () => {
    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      address: '0x0',
    });
    const { result } = renderHookWithConfirmContextProvider(
      () => useSelectedAccountAlerts(),
      getMockConfirmStateForTransaction(contractInteraction as TransactionMeta),
    );
    expect(result.current).toEqual(expectedAlert);
  });

  it('does not returns an alert for transaction if signing account is same as selected account', () => {
    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    });
    const { result } = renderHookWithConfirmContextProvider(
      () => useSelectedAccountAlerts(),
      getMockConfirmStateForTransaction(contractInteraction as TransactionMeta),
    );
    expect(result.current).toEqual([]);
  });
});
