import { IconName } from '../../components/component-library';
import { IconColor } from '../constants/design-system';
import { TrustSignalDisplayState } from '../../hooks/useTrustSignals';
import {
  getTrustSignalIcon,
  getTrustSignalCssClasses,
  TrustSignalIconProps,
  TrustSignalCssContext,
} from './trust-signals';

describe('trust-signals utilities', () => {
  describe('getTrustSignalIcon', () => {
    it('returns danger icon for malicious state', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Malicious);

      expect(result).toStrictEqual<TrustSignalIconProps>({
        name: IconName.Danger,
        color: IconColor.errorDefault,
      });
    });

    it('returns verified icon for verified state', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Verified);

      expect(result).toStrictEqual<TrustSignalIconProps>({
        name: IconName.VerifiedFilled,
        color: IconColor.infoDefault,
      });
    });

    it('returns question icon for unknown state', () => {
      const result = getTrustSignalIcon(TrustSignalDisplayState.Unknown);

      expect(result).toStrictEqual<TrustSignalIconProps>({
        name: IconName.Question,
        color: IconColor.iconDefault,
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

      expect(result).toStrictEqual<TrustSignalIconProps>({
        name: IconName.Question,
        color: IconColor.iconDefault,
      });
    });
  });

  describe('getTrustSignalCssClasses', () => {
    describe('base functionality', () => {
      it('always includes base name class', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
        );

        expect(result).toContain('name');
      });

      it('includes clickable class when isClickable is true', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {
            isClickable: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__clickable');
      });

      it('does not include clickable class when isClickable is false', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {
            isClickable: false,
          },
        );

        expect(result).toContain('name');
        expect(result).not.toContain('name__clickable');
      });

      it('handles empty context object', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {},
        );

        expect(result).toContain('name');
        expect(result).not.toContain('name__clickable');
      });

      it('handles undefined context', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
        );

        expect(result).toContain('name');
        expect(result).not.toContain('name__clickable');
      });
    });

    describe('malicious state', () => {
      it('includes malicious class for malicious state', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Malicious,
        );

        expect(result).toContain('name');
        expect(result).toContain('name__malicious');
      });

      it('includes saved class when hasPetname is true', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Malicious,
          {
            hasPetname: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__malicious');
        expect(result).toContain('name__saved');
      });

      it('includes missing class when no display name and no petname', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Malicious,
          {
            hasPetname: false,
            hasDisplayName: false,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__malicious');
        expect(result).toContain('name__missing');
      });

      it('does not include additional classes when has display name but no petname', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Malicious,
          {
            hasPetname: false,
            hasDisplayName: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__malicious');
        expect(result).not.toContain('name__saved');
        expect(result).not.toContain('name__missing');
      });
    });

    describe('verified state', () => {
      it('includes verified class for verified state', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Verified,
        );

        expect(result).toContain('name');
        expect(result).toContain('name__verified');
      });

      it('only includes verified class regardless of context', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Verified,
          {
            hasPetname: true,
            hasDisplayName: true,
            isClickable: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__verified');
        expect(result).toContain('name__clickable');
        expect(result).not.toContain('name__saved');
        expect(result).not.toContain('name__missing');
      });
    });

    describe('warning state', () => {
      it('includes warning class for warning state', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Warning,
        );

        expect(result).toContain('name');
        expect(result).toContain('name__warning');
      });

      it('includes recognized_unsaved class when has display name but no petname', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Warning,
          {
            hasDisplayName: true,
            hasPetname: false,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__warning');
        expect(result).toContain('name__recognized_unsaved');
      });

      it('includes missing class when no display name', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Warning,
          {
            hasDisplayName: false,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__warning');
        expect(result).toContain('name__missing');
      });

      it('does not include additional classes when has petname', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Warning,
          {
            hasPetname: true,
            hasDisplayName: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__warning');
        expect(result).not.toContain('name__recognized_unsaved');
        expect(result).not.toContain('name__missing');
      });
    });

    describe('petname state', () => {
      it('includes saved class for petname state', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Petname,
        );

        expect(result).toContain('name');
        expect(result).toContain('name__saved');
      });

      it('only includes saved class regardless of context', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Petname,
          {
            hasPetname: false, // This should be ignored for petname state
            hasDisplayName: true,
            isClickable: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__saved');
        expect(result).toContain('name__clickable');
        expect(result).not.toContain('name__missing');
        expect(result).not.toContain('name__recognized_unsaved');
      });
    });

    describe('recognized state', () => {
      it('includes recognized_unsaved class for recognized state', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Recognized,
        );

        expect(result).toContain('name');
        expect(result).toContain('name__recognized_unsaved');
      });

      it('only includes recognized_unsaved class regardless of context', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Recognized,
          {
            hasPetname: true, // This should be ignored for recognized state
            hasDisplayName: false, // This should be ignored for recognized state
            isClickable: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__recognized_unsaved');
        expect(result).toContain('name__clickable');
        expect(result).not.toContain('name__saved');
        expect(result).not.toContain('name__missing');
      });
    });

    describe('unknown state and default case', () => {
      it('includes saved class when hasPetname is true', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {
            hasPetname: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__saved');
      });

      it('includes recognized_unsaved class when has display name but no petname', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {
            hasPetname: false,
            hasDisplayName: true,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__recognized_unsaved');
      });

      it('includes missing class when no petname and no display name', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {
            hasPetname: false,
            hasDisplayName: false,
          },
        );

        expect(result).toContain('name');
        expect(result).toContain('name__missing');
      });

      it('handles invalid state with default case logic', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = getTrustSignalCssClasses('invalid-state' as any, {
          hasPetname: true,
          hasDisplayName: false,
        });

        expect(result).toContain('name');
        expect(result).toContain('name__saved');
      });
    });

    describe('complex context combinations', () => {
      it('handles all context flags together for malicious state', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Malicious,
          {
            hasPetname: true,
            hasDisplayName: true,
            isClickable: true,
          },
        );

        expect(result).toEqual([
          'name',
          'name__clickable',
          'name__malicious',
          'name__saved',
        ]);
      });

      it('handles all context flags together for warning state with display name', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Warning,
          {
            hasPetname: false,
            hasDisplayName: true,
            isClickable: true,
          },
        );

        expect(result).toEqual([
          'name',
          'name__clickable',
          'name__warning',
          'name__recognized_unsaved',
        ]);
      });

      it('handles all context flags together for unknown state with no names', () => {
        const result = getTrustSignalCssClasses(
          TrustSignalDisplayState.Unknown,
          {
            hasPetname: false,
            hasDisplayName: false,
            isClickable: true,
          },
        );

        expect(result).toEqual(['name', 'name__clickable', 'name__missing']);
      });
    });

    describe('return value consistency', () => {
      it('always returns an array', () => {
        const states = [
          TrustSignalDisplayState.Malicious,
          TrustSignalDisplayState.Verified,
          TrustSignalDisplayState.Warning,
          TrustSignalDisplayState.Petname,
          TrustSignalDisplayState.Recognized,
          TrustSignalDisplayState.Unknown,
        ];

        states.forEach((state) => {
          const result = getTrustSignalCssClasses(state);
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeGreaterThan(0);
        });
      });

      it('never returns duplicate classes', () => {
        const contexts: TrustSignalCssContext[] = [
          {},
          { hasPetname: true },
          { hasDisplayName: true },
          { isClickable: true },
          { hasPetname: true, hasDisplayName: true, isClickable: true },
        ];

        const states = [
          TrustSignalDisplayState.Malicious,
          TrustSignalDisplayState.Warning,
          TrustSignalDisplayState.Unknown,
        ];

        states.forEach((state) => {
          contexts.forEach((context) => {
            const result = getTrustSignalCssClasses(state, context);
            const uniqueClasses = [...new Set(result)];
            expect(result).toEqual(uniqueClasses);
          });
        });
      });
    });
  });
});
