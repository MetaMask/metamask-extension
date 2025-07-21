import { IconName } from '../../components/component-library';
import { IconColor } from '../constants/design-system';
import { TrustSignalDisplayState } from '../../hooks/useTrustSignals';
import { getTrustSignalIcon, IconProps } from './trust-signals';

describe('trust-signals utilities', () => {
  describe('getTrustSignalIcon', () => {
    it('returns danger icon for malicious state', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Malicious);

      expect(result).toStrictEqual<IconProps>({
        name: IconName.Danger,
        color: IconColor.errorDefault,
      });
    });

    it('returns verified icon for verified state', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Verified);

      expect(result).toStrictEqual<IconProps>({
        name: IconName.VerifiedFilled,
        color: IconColor.infoDefault,
      });
    });

    it('returns question icon for unknown state', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Unknown);

      expect(result).toStrictEqual<IconProps>({
        name: IconName.Question,
        color: undefined,
      });
    });

    it('returns null for warning state (uses identicon)', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Warning);

      expect(result).toBeNull();
    });

    it('returns null for petname state (uses identicon)', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Petname);

      expect(result).toBeNull();
    });

    it('returns null for recognized state (uses identicon)', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Recognized);

      expect(result).toBeNull();
    });

    it('returns question icon for default/unknown case', () => {
      // TypeScript won't allow invalid enum values, so we test with 'as any'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = getTrustSignalIcon('invalid-state' as any);

      expect(result).toStrictEqual<IconProps>({
        name: IconName.Question,
        color: undefined,
      });
    });
  });
});
