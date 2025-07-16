import mockState from '../../../../../../test/data/mock-state.json';
import { getMockPersonalSignConfirmStateForRequest } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { signatureRequestSIWE } from '../../../../../../test/data/confirmations/personal_sign';
import { Severity } from '../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../types/confirm';
import useAccountMismatchAlerts from './useAccountMismatchAlerts';

const mockExpectedState =
  getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE);

describe('useAccountMismatchAlerts', () => {
  beforeAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'true';
  });

  afterAll(() => {
    process.env.ENABLE_CONFIRMATION_REDESIGN = 'false';
  });

  describe('returns an empty array', () => {
    it('when there is no current confirmation', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useAccountMismatchAlerts(),
        mockState,
      );
      expect(result.current).toEqual([]);
    });

    it('when the current confirmation is not a SIWE request', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useAccountMismatchAlerts(),
        mockExpectedState,
      );
      expect(result.current).toEqual([]);
    });

    it('when the current confirmation is a SIWE request and the msgParams account matches the selected account', () => {
      const { result } = renderHookWithConfirmContextProvider(
        () => useAccountMismatchAlerts(),
        mockExpectedState,
      );
      expect(result.current).toEqual([]);
    });
  });

  it('returns an alert when the confirmation is SIWE and the msgParams address does not match the selected address', () => {
    const MOCK_NON_SELECTED_ADDRESS =
      '0x12345d886577d5081b0c52e242ef29e70be3eabc';

    const expectedResult = [
      {
        field: 'signingInWith',
        key: 'signingInWith',
        message: 'This site is asking you to sign in using the wrong account.',
        reason: 'Wrong account',
        severity: Severity.Warning,
      },
    ];

    const { result } = renderHookWithConfirmContextProvider(
      () => useAccountMismatchAlerts(),
      getMockPersonalSignConfirmStateForRequest({
        ...signatureRequestSIWE,
        msgParams: {
          ...signatureRequestSIWE.msgParams,
          siwe: {
            isSIWEMessage: true,
            parsedMessage: {
              ...signatureRequestSIWE.msgParams?.siwe?.parsedMessage,
              address: MOCK_NON_SELECTED_ADDRESS,
            },
          },
        },
      } as SignatureRequestType),
    );

    expect(result.current).toStrictEqual(expectedResult);
  });
});
