import { ApprovalType } from '@metamask/controller-utils';

import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import {
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import mockState from '../../../../../../test/data/mock-state.json';
import { Severity } from '../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../types/confirm';
import useDomainMismatchAlert from './useDomainMismatchAlerts';

const MOCK_ORIGIN = 'https://example-dapp.example';
const MOCK_SUSPICIOUS_DOMAIN = 'http://suspicious.example';
const MOCK_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const mockSiwe = {
  isSIWEMessage: true,
  parsedMessage: {
    domain: MOCK_SUSPICIOUS_DOMAIN,
    address: MOCK_ADDRESS,
    statement:
      'Click to sign in and accept the Terms of Service: https://community.metamask.io/tos',
    uri: 'http://localhost:8080',
    version: '1',
    nonce: 'STMt6KQMwwdOXE306',
    chainId: 1,
    issuedAt: '2023-03-18T21:40:40.823Z',
    resources: [
      'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
      'https://example.com/my-web2-claim.json',
    ],
  },
};

const mockCurrentConfirmation = {
  id: '1',
  status: 'unapproved',
  time: new Date().getTime(),
  type: ApprovalType.PersonalSign,
  msgParams: {
    from: MOCK_ADDRESS,
    data: '0x6c6f63616c686f73743a383038302077616e747320796f7520746f207369676e20696e207769746820796f757220457468657265756d206163636f756e743a0a3078466232433135303034333433393034653566343038323537386334653865313131303563463765330a0a436c69636b20746f207369676e20696e20616e642061636365707420746865205465726d73206f6620536572766963653a2068747470733a2f2f636f6d6d756e6974792e6d6574616d61736b2e696f2f746f730a0a5552493a20687474703a2f2f6c6f63616c686f73743a383038300a56657273696f6e3a20310a436861696e2049443a20310a4e6f6e63653a2053544d74364b514d7777644f58453330360a4973737565642041743a20323032322d30332d31385432313a34303a34302e3832335a0a5265736f75726365733a0a2d20697066733a2f2f516d653773733341525667787636725871565069696b4d4a3875324e4c676d67737a673133705972444b456f69750a2d2068747470733a2f2f6578616d706c652e636f6d2f6d792d776562322d636c61696d2e6a736f6e',
    origin: MOCK_ORIGIN,
    siwe: mockSiwe,
  },
};

const mockExpectedState = getMockPersonalSignConfirmStateForRequest(
  mockCurrentConfirmation as unknown as SignatureRequestType,
);

describe('useDomainMismatchAlert', () => {
  describe('returns an empty array', () => {
    it('when there is no current confirmation', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useDomainMismatchAlert(),
        mockState,
      );
      expect(result.current).toEqual([]);
    });

    it('when the current confirmation is not a SIWE request', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useDomainMismatchAlert(),
        getMockPersonalSignConfirmState(),
      );
      expect(result.current).toEqual([]);
    });

    it('when the SIWE domain matches origin', () => {
      const originalDomain = mockSiwe.parsedMessage.domain;
      mockSiwe.parsedMessage.domain = MOCK_ORIGIN;

      const { result } = renderHookWithConfirmContextProvider(
        () => useDomainMismatchAlert(),
        mockExpectedState,
      );
      expect(result.current).toEqual([]);

      mockSiwe.parsedMessage.domain = originalDomain;
    });
  });

  it('returns an alert when the SIWE domain does not match the origin', () => {
    const alertResponseExpected = {
      field: 'requestFrom',
      key: 'requestFrom',
      message:
        'The site making the request is not the site you’re signing into. This could be an attempt to steal your login credentials.',
      reason: 'Suspicious sign-in request',
      severity: Severity.Danger,
    };
    const { result } = renderHookWithConfirmContextProvider(
      () => useDomainMismatchAlert(),
      mockExpectedState,
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toStrictEqual(alertResponseExpected);
  });
});
