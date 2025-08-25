import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import {
  useTrustSignal,
  useTrustSignals,
  TrustSignalDisplayState,
  UseTrustSignalRequest,
} from './useTrustSignals';

jest.mock('react-redux', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getAddressSecurityAlertResponse: jest.fn(),
}));

const VALUE_MOCK = '0x1234567890123456789012345678901234567890';
const VALUE_MOCK_2 = '0x9876543210987654321098765432109876543210';
const TRUST_LABEL_MOCK = 'Malicious Address';
const VERIFIED_LABEL_MOCK = 'Verified Contract';
const WARNING_LABEL_MOCK = 'Suspicious Activity';

describe('useTrustSignals', () => {
  const getAddressSecurityAlertResponseMock = jest.mocked(
    getAddressSecurityAlertResponse,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('useTrustSignal', () => {
    it('returns the first result from useTrustSignals', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: ResultType.Malicious,
        label: TRUST_LABEL_MOCK,
      });

      const result = useTrustSignal(VALUE_MOCK, NameType.ETHEREUM_ADDRESS);

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Malicious,
        label: TRUST_LABEL_MOCK,
      });
    });
  });

  describe('useTrustSignals', () => {
    describe('Ethereum addresses with security alert responses', () => {
      it('returns malicious state for malicious addresses', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Malicious,
          label: TRUST_LABEL_MOCK,
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Malicious,
          label: TRUST_LABEL_MOCK,
        });

        expect(getAddressSecurityAlertResponseMock).toHaveBeenCalledWith(
          undefined,
          VALUE_MOCK,
        );
      });

      it('returns warning state for warning addresses', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Warning,
          label: WARNING_LABEL_MOCK,
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Warning,
          label: WARNING_LABEL_MOCK,
        });
      });

      it('returns verified state for trusted addresses', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Trusted,
          label: VERIFIED_LABEL_MOCK,
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Verified,
          label: VERIFIED_LABEL_MOCK,
        });
      });

      it('returns unknown state for benign addresses', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Benign,
          label: 'Benign Address',
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: 'Benign Address',
        });
      });

      it('returns unknown state for error result type', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.ErrorResult,
          label: 'Error occurred',
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: 'Error occurred',
        });
      });

      it('returns unknown state for undefined result_type', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          label: 'Some label',
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: 'Some label',
        });
      });

      it('handles missing label gracefully', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Trusted,
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Verified,
          label: null,
        });
      });
    });

    describe('No security alert response', () => {
      it('returns unknown state when no address is provided', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue(undefined);

        const requests: UseTrustSignalRequest[] = [
          {
            value: '',
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: null,
        });
      });

      it('returns unknown state when security alert response is null (checked but no data)', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue(null);

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: null,
        });
      });

      it('returns loading state when security alert response is undefined (not yet checked)', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue(undefined);

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Loading,
          label: null,
        });
      });
    });

    describe('Multiple requests', () => {
      it('handles multiple requests correctly', () => {
        getAddressSecurityAlertResponseMock
          .mockReturnValueOnce({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: ResultType.Malicious,
            label: TRUST_LABEL_MOCK,
          })
          .mockReturnValueOnce({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: ResultType.Trusted,
            label: VERIFIED_LABEL_MOCK,
          });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
          {
            value: VALUE_MOCK_2,
            type: NameType.ETHEREUM_ADDRESS,
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(2);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Malicious,
          label: TRUST_LABEL_MOCK,
        });
        expect(results[1]).toStrictEqual({
          state: TrustSignalDisplayState.Verified,
          label: VERIFIED_LABEL_MOCK,
        });

        expect(getAddressSecurityAlertResponseMock).toHaveBeenCalledTimes(2);
        expect(getAddressSecurityAlertResponseMock).toHaveBeenNthCalledWith(
          1,
          undefined,
          VALUE_MOCK,
        );
        expect(getAddressSecurityAlertResponseMock).toHaveBeenNthCalledWith(
          2,
          undefined,
          VALUE_MOCK_2,
        );
      });

      it('handles empty requests array', () => {
        const results = useTrustSignals([]);

        expect(results).toHaveLength(0);
        expect(getAddressSecurityAlertResponseMock).not.toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('handles mixed address types in multiple requests', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Malicious,
          label: TRUST_LABEL_MOCK,
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
          },
          {
            value: 'test.eth',
            type: NameType.ETHEREUM_ADDRESS, // Using ETHEREUM_ADDRESS as it's the only supported type
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(2);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Malicious,
          label: TRUST_LABEL_MOCK,
        });
        expect(results[1]).toStrictEqual({
          state: TrustSignalDisplayState.Malicious,
          label: TRUST_LABEL_MOCK,
        });
      });
    });
  });
});
