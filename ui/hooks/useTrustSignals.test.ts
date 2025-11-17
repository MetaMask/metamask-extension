import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
import {
  ResultType,
  SupportedEVMChain,
  mapChainIdToSupportedEVMChain,
} from '../../shared/lib/trust-signals';
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

jest.mock('../../shared/lib/trust-signals', () => {
  const actual = jest.requireActual('../../shared/lib/trust-signals');
  return {
    ...actual,
    mapChainIdToSupportedEVMChain: jest.fn(),
  };
});

const VALUE_MOCK = '0x1234567890123456789012345678901234567890';
const VALUE_MOCK_2 = '0x9876543210987654321098765432109876543210';
const TRUST_LABEL_MOCK = 'Malicious Address';
const VERIFIED_LABEL_MOCK = 'Verified Contract';
const WARNING_LABEL_MOCK = 'Suspicious Activity';

describe('useTrustSignals', () => {
  const getAddressSecurityAlertResponseMock = jest.mocked(
    getAddressSecurityAlertResponse,
  );
  const mapChainIdToSupportedEVMChainMock = jest.mocked(
    mapChainIdToSupportedEVMChain,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mapChainIdToSupportedEVMChainMock.mockReturnValue(
      SupportedEVMChain.Ethereum,
    );
  });

  describe('useTrustSignal', () => {
    it('returns the first result from useTrustSignals', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: ResultType.Malicious,
        label: TRUST_LABEL_MOCK,
      });

      const result = useTrustSignal(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        '0x1',
      );

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
            chainId: '0x1',
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
          `ethereum:${VALUE_MOCK.toLowerCase()}`,
        );
      });

      it('returns unknown state when no chain id is provided', () => {
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
            chainId: '',
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: null,
        });
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
            chainId: '0x1',
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
            chainId: '0x1',
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
            chainId: '0x1',
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
            chainId: '0x1',
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
            chainId: '0x1',
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
            chainId: '0x1',
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
            chainId: '0x1',
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: null,
        });
      });

      it('returns unknown state when security alert response is undefined (no check initiated)', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue(undefined);

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            chainId: '0x1',
          },
        ];

        const results = useTrustSignals(requests);

        expect(results).toHaveLength(1);
        expect(results[0]).toStrictEqual({
          state: TrustSignalDisplayState.Unknown,
          label: null,
        });
      });

      it('returns loading state when security alert response has Loading result type', () => {
        getAddressSecurityAlertResponseMock.mockReturnValue({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: ResultType.Loading,
          label: '',
        });

        const requests: UseTrustSignalRequest[] = [
          {
            value: VALUE_MOCK,
            type: NameType.ETHEREUM_ADDRESS,
            chainId: '0x1',
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
            chainId: '0x1',
          },
          {
            value: VALUE_MOCK_2,
            type: NameType.ETHEREUM_ADDRESS,
            chainId: '0x1',
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
          `ethereum:${VALUE_MOCK.toLowerCase()}`,
        );
        expect(getAddressSecurityAlertResponseMock).toHaveBeenNthCalledWith(
          2,
          undefined,
          `ethereum:${VALUE_MOCK_2.toLowerCase()}`,
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
            chainId: '0x1',
          },
          {
            value: 'test.eth',
            type: NameType.ETHEREUM_ADDRESS, // Using ETHEREUM_ADDRESS as it's the only supported type
            chainId: '0x1',
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
