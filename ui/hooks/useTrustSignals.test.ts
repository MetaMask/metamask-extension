import { NameType } from '@metamask/name-controller';
import { getAddressSecurityAlertResponse } from '../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../app/scripts/lib/trust-signals/types';
import { useDisplayName } from './useDisplayName';
import { useTrustSignals, TrustSignalDisplayState } from './useTrustSignals';

jest.mock('react-redux', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector: (selector: any) => selector(),
}));

jest.mock('../selectors', () => ({
  getAddressSecurityAlertResponse: jest.fn(),
}));

jest.mock('./useDisplayName', () => ({
  useDisplayName: jest.fn(),
}));

const VALUE_MOCK = '0x1234567890123456789012345678901234567890';
const VARIATION_MOCK = '0x1';
const TRUST_LABEL_MOCK = 'Malicious Address';
const DISPLAY_NAME_MOCK = 'Test Contract';
const PETNAME_MOCK = 'My Saved Address';
const VERIFIED_LABEL_MOCK = 'Verified Contract';
const WARNING_LABEL_MOCK = 'Suspicious Activity';

describe('useTrustSignals', () => {
  const getAddressSecurityAlertResponseMock = jest.mocked(
    getAddressSecurityAlertResponse,
  );
  const useDisplayNameMock = jest.mocked(useDisplayName);

  beforeEach(() => {
    jest.resetAllMocks();

    useDisplayNameMock.mockReturnValue({
      name: null,
      hasPetname: false,
      image: undefined,
      contractDisplayName: undefined,
    });
  });

  describe('Priority 1: Malicious takes precedence when trust signals are enabled', () => {
    it('returns malicious state when security alert indicates malicious address and trust signals are enabled', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Malicious,
        label: TRUST_LABEL_MOCK,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true, // showTrustSignals enabled
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Malicious,
        trustLabel: TRUST_LABEL_MOCK,
      });

      expect(getAddressSecurityAlertResponseMock).toHaveBeenCalled();
      expect(useDisplayNameMock).toHaveBeenCalledWith({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        variation: VARIATION_MOCK,
      });
    });

    it('does not return malicious state when trust signals are disabled, even for malicious addresses', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Malicious,
        label: TRUST_LABEL_MOCK,
      });

      useDisplayNameMock.mockReturnValue({
        name: DISPLAY_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        false, // showTrustSignals disabled
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Recognized,
        trustLabel: DISPLAY_NAME_MOCK,
      });
    });
  });

  describe('Priority 2: Petname takes precedence over trust signals (except malicious)', () => {
    it('returns petname state when hasPetname is true, even with trust signals enabled', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Trusted,
        label: VERIFIED_LABEL_MOCK,
      });

      useDisplayNameMock.mockReturnValue({
        name: PETNAME_MOCK,
        hasPetname: true,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Petname,
        trustLabel: PETNAME_MOCK,
      });
    });

    it('returns petname state when hasPetname is true and trust signals are disabled', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue(null);

      useDisplayNameMock.mockReturnValue({
        name: PETNAME_MOCK,
        hasPetname: true,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        false,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Petname,
        trustLabel: PETNAME_MOCK,
      });
    });

    it('malicious still takes precedence over petname when trust signals are enabled', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Malicious,
        label: TRUST_LABEL_MOCK,
      });

      useDisplayNameMock.mockReturnValue({
        name: PETNAME_MOCK,
        hasPetname: true,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Malicious,
        trustLabel: TRUST_LABEL_MOCK,
      });
    });
  });

  describe('Priority 3: Recognized name takes precedence over other trust signals', () => {
    it('returns recognized state when displayName exists, even with verified trust signal', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Trusted,
        label: VERIFIED_LABEL_MOCK,
      });

      useDisplayNameMock.mockReturnValue({
        name: DISPLAY_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Recognized,
        trustLabel: DISPLAY_NAME_MOCK,
      });
    });

    it('returns recognized state when displayName exists, even with warning trust signal', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Warning,
        label: WARNING_LABEL_MOCK,
      });

      useDisplayNameMock.mockReturnValue({
        name: DISPLAY_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Recognized,
        trustLabel: DISPLAY_NAME_MOCK,
      });
    });

    it('returns recognized state when displayName exists and no trust signals', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue(null);

      useDisplayNameMock.mockReturnValue({
        name: DISPLAY_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Recognized,
        trustLabel: DISPLAY_NAME_MOCK,
      });
    });

    it('returns recognized state when displayName exists and trust signals disabled', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Trusted,
        label: VERIFIED_LABEL_MOCK,
      });

      useDisplayNameMock.mockReturnValue({
        name: DISPLAY_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        false,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Recognized,
        trustLabel: DISPLAY_NAME_MOCK,
      });
    });
  });

  describe('Priority 4-6: Trust signal states when enabled, no petname, and no recognized name', () => {
    beforeEach(() => {
      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });
    });

    it('returns verified state for trusted addresses', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Trusted,
        label: VERIFIED_LABEL_MOCK,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Verified,
        trustLabel: VERIFIED_LABEL_MOCK,
      });
    });

    it('returns warning state for warning addresses', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Warning,
        label: WARNING_LABEL_MOCK,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Warning,
        trustLabel: WARNING_LABEL_MOCK,
      });
    });

    it('returns unknown state for benign addresses', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Benign,
        label: 'Benign Address',
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Unknown,
        trustLabel: 'Benign Address',
      });
    });

    it('returns unknown state for error result type', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.ErrorResult,
        label: 'Error occurred',
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Unknown,
        trustLabel: 'Error occurred',
      });
    });

    it('ignores trust signals when showTrustSignals is false', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Trusted,
        label: VERIFIED_LABEL_MOCK,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        false,
      );

      expect(result).toBeNull();
    });
  });

  describe('Priority 7: Default null return', () => {
    it('returns null when no security alert, no petname, and no display name', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue(null);

      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toBeNull();
    });

    it('returns null when security response exists but no result_type', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        label: 'Some label',
      });

      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toBeNull();
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles undefined security alert response gracefully', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue(undefined);

      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toBeNull();
    });

    it('handles security alert response without label', () => {
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Trusted,
      });

      useDisplayNameMock.mockReturnValue({
        name: null,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Verified,
        trustLabel: null,
      });
    });

    it('preserves trust label through all priority levels', () => {
      const testLabel = 'Test Label';
      getAddressSecurityAlertResponseMock.mockReturnValue({
        result_type: ResultType.Benign,
        label: testLabel,
      });

      useDisplayNameMock.mockReturnValue({
        name: DISPLAY_NAME_MOCK,
        hasPetname: false,
        image: undefined,
        contractDisplayName: undefined,
      });

      const result = useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        false,
      );

      expect(result).toStrictEqual({
        state: TrustSignalDisplayState.Recognized,
        trustLabel: DISPLAY_NAME_MOCK,
      });
    });
  });

  describe('Hook dependencies', () => {
    it('calls getAddressSecurityAlertResponse with correct parameters', () => {
      useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(getAddressSecurityAlertResponseMock).toHaveBeenCalled();
    });

    it('calls useDisplayName with correct parameters', () => {
      useTrustSignals(
        VALUE_MOCK,
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(useDisplayNameMock).toHaveBeenCalledWith({
        value: VALUE_MOCK,
        type: NameType.ETHEREUM_ADDRESS,
        variation: VARIATION_MOCK,
      });
    });

    it('works with different NameType values', () => {
      const result = useTrustSignals(
        'test-value',
        NameType.ETHEREUM_ADDRESS,
        VARIATION_MOCK,
        true,
      );

      expect(useDisplayNameMock).toHaveBeenCalledWith({
        value: 'test-value',
        type: NameType.ETHEREUM_ADDRESS,
        variation: VARIATION_MOCK,
      });

      if (result !== null) {
        expect(result).toHaveProperty('state');
        expect(result).toHaveProperty('trustLabel');
      }
    });
  });
});
