import { TransactionMeta } from '@metamask/transaction-controller';

import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import {
  getMockConfirmStateForTransaction,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { unapprovedTypedSignMsgV4 } from '../../../../test/data/confirmations/typed_sign';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../../../app/scripts/lib/trust-signals/types';
import { useTrustSignalMetrics } from './useTrustSignalMetrics';
import * as useTransactionEventFragmentHook from './useTransactionEventFragment';
import * as useSignatureEventFragmentHook from './useSignatureEventFragment';

jest.mock('./useTransactionEventFragment');
jest.mock('./useSignatureEventFragment');

const mockUpdateTransactionEventFragment = jest.fn();
const mockUpdateSignatureEventFragment = jest.fn();

const OWNER_ID_MOCK = '123';
const TARGET_ADDRESS_MOCK = '0x88aa6343307ec9a652ccddda3646e62b2f1a5125'; // This is the default "to" address from genUnapprovedContractInteractionConfirmation
const SIGNATURE_VERIFYING_CONTRACT_MOCK =
  '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'; // verifyingContract from unapprovedTypedSignMsgV3
const SECURITY_ALERT_RESPONSE_MOCK = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  result_type: ResultType.Malicious,
  label: 'Malicious',
  reason: 'This address is associated with fraudulent activities',
};

const contractInteraction = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
});
const TX_STATE_MOCK_NO_ALERT = getMockConfirmStateForTransaction(
  { ...contractInteraction, id: OWNER_ID_MOCK } as TransactionMeta,
  {
    metamask: {},
  },
);
const TX_STATE_MOCK = getMockConfirmStateForTransaction(
  { ...contractInteraction, id: OWNER_ID_MOCK } as TransactionMeta,
  {
    metamask: {
      addressSecurityAlertResponses: {
        [TARGET_ADDRESS_MOCK.toLowerCase()]: SECURITY_ALERT_RESPONSE_MOCK,
      },
    },
  },
);

const signatureRequest = { ...unapprovedTypedSignMsgV4, id: OWNER_ID_MOCK };
const SIGNATURE_STATE_MOCK = getMockTypedSignConfirmStateForRequest(
  signatureRequest,
  {
    metamask: {
      addressSecurityAlertResponses: {
        [SIGNATURE_VERIFYING_CONTRACT_MOCK.toLowerCase()]:
          SECURITY_ALERT_RESPONSE_MOCK,
      },
    },
  },
);
const SIGNATURE_STATE_MOCK_NO_ALERT = getMockTypedSignConfirmStateForRequest(
  signatureRequest,
  {
    metamask: {},
  },
);

beforeEach(() => {
  jest.clearAllMocks();
  (
    useTransactionEventFragmentHook.useTransactionEventFragment as jest.Mock
  ).mockReturnValue({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  });
  (
    useSignatureEventFragmentHook.useSignatureEventFragment as jest.Mock
  ).mockReturnValue({
    updateSignatureEventFragment: mockUpdateSignatureEventFragment,
  });
});

describe('useTrustSignalMetrics', () => {
  describe('transactions', () => {
    it('does not update event fragments when no security alert response', () => {
      renderHookWithConfirmContextProvider(
        () => useTrustSignalMetrics(),
        TX_STATE_MOCK_NO_ALERT,
      );

      expect(mockUpdateTransactionEventFragment).not.toHaveBeenCalled();
      expect(mockUpdateSignatureEventFragment).not.toHaveBeenCalled();
    });

    it('updates event fragments with trust signal metrics when security alert response exists', () => {
      renderHookWithConfirmContextProvider(
        () => useTrustSignalMetrics(),
        TX_STATE_MOCK,
      );

      const expectedProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_alert_response: ResultType.Malicious,
      };

      const expectedAnonymousProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_label: 'Malicious',
      };

      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        { properties: expectedProperties },
        OWNER_ID_MOCK,
      );
      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        { sensitiveProperties: expectedAnonymousProperties },
        OWNER_ID_MOCK,
      );
      expect(mockUpdateSignatureEventFragment).not.toHaveBeenCalled();
    });
  });

  describe('signatures', () => {
    it('does not update event fragments when no security alert response', () => {
      renderHookWithConfirmContextProvider(
        () => useTrustSignalMetrics(),
        SIGNATURE_STATE_MOCK_NO_ALERT,
      );

      expect(mockUpdateSignatureEventFragment).not.toHaveBeenCalled();
      expect(mockUpdateTransactionEventFragment).not.toHaveBeenCalled();
    });

    it('updates event fragments with trust signal metrics when security alert response exists', () => {
      const expectedProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_alert_response: ResultType.Malicious,
      };

      const expectedAnonymousProperties = {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_label: 'Malicious',
      };

      renderHookWithConfirmContextProvider(
        () => useTrustSignalMetrics(),
        SIGNATURE_STATE_MOCK,
      );

      expect(mockUpdateSignatureEventFragment).toHaveBeenCalledWith({
        properties: expectedProperties,
      });
      expect(mockUpdateSignatureEventFragment).toHaveBeenCalledWith({
        sensitiveProperties: expectedAnonymousProperties,
      });
      expect(mockUpdateTransactionEventFragment).not.toHaveBeenCalled();
    });
  });
});
