import { TransactionMeta } from '@metamask/transaction-controller';

import mockState from '../../../../../test/data/mock-state.json';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { unapprovedPersonalSignMsg } from '../../../../../test/data/confirmations/personal_sign';
import { SignatureRequestType } from '../../types/confirm';
import useConfirmationOriginAlerts from './useConfirmationOriginAlerts';

const expectedAlert = [
  {
    key: 'originSpecialCharacterWarning',
    message:
      "Attackers sometimes mimic sites by making small changes to the site address. Make sure you're interacting with the intended site before you continue.",
    reason: 'Site address mismatch',
    severity: 'warning',
    alertDetails: [
      'Current URL: https://iոfura.io/gnosis',
      'Punycode version: https://xn--ifura-dig.io/gnosis',
    ],
    field: 'requestFrom',
  },
];

describe('useConfirmationOriginAlerts', () => {
  it('returns an empty array when there is no current confirmation', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationOriginAlerts(),
      mockState,
    );
    expect(result.current).toEqual([]);
  });

  it('returns an alert for signature with special characters in origin', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationOriginAlerts(),
      getMockPersonalSignConfirmStateForRequest({
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          origin: 'https://iոfura.io/gnosis',
        },
      } as SignatureRequestType),
    );
    expect(result.current).toEqual(expectedAlert);
  });

  it('returns an alert for transaction with special characters in origin', () => {
    const contractInteraction = genUnapprovedContractInteractionConfirmation({
      chainId: mockState.metamask.networkConfigurations.goerli.chainId,
    });
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationOriginAlerts(),
      getMockConfirmStateForTransaction({
        ...contractInteraction,
        origin: 'https://iոfura.io/gnosis',
      } as TransactionMeta),
    );
    expect(result.current).toEqual(expectedAlert);
  });
});
