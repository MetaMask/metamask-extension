import { it } from '@jest/globals';
import { IconColor, IconName } from '@metamask/design-system-react';
import {
  getSecurityInlineBadge,
  getSecurityStatusBadge,
} from './security-badge';

describe('getSecurityInlineBadge', () => {
  it('returns the expected badges', () => {
    for (const [resultType, icon, iconColor, accessibleLabel] of [
      ['Verified', IconName.VerifiedFilled, IconColor.InfoDefault, 'Verified'],
      ['Warning', IconName.Warning, IconColor.WarningDefault, 'Risky'],
      ['Spam', IconName.Warning, IconColor.WarningDefault, 'Risky'],
      ['Malicious', IconName.Danger, IconColor.ErrorDefault, 'Malicious'],
    ] as const) {
      expect(getSecurityInlineBadge(resultType)).toEqual({
        icon,
        iconColor,
        label: null,
        accessibleLabel,
      });
    }
  });

  it('returns null for an unknown result', () => {
    expect(getSecurityInlineBadge('Unknown')).toBeNull();
  });
});

describe('getSecurityStatusBadge', () => {
  it('returns a verified badge', () => {
    expect(getSecurityStatusBadge('Verified')).toEqual({
      icon: IconName.SecurityTick,
      iconColor: IconColor.SuccessDefault,
      label: 'Verified',
      tone: 'success',
    });
  });

  it.each(['Warning', 'Spam'] as const)(
    'returns a risky badge for %s',
    (resultType) => {
      expect(getSecurityStatusBadge(resultType)).toEqual({
        icon: IconName.Warning,
        iconColor: IconColor.WarningDefault,
        label: 'Risky',
        tone: 'warning',
      });
    },
  );

  it('returns a malicious badge', () => {
    expect(getSecurityStatusBadge('Malicious')).toEqual({
      icon: IconName.Danger,
      iconColor: IconColor.ErrorDefault,
      label: 'Malicious',
      tone: 'error',
    });
  });

  it.each([null, undefined, 'Unknown'] as const)(
    'returns null for %s',
    (resultType) => {
      expect(getSecurityStatusBadge(resultType)).toBeNull();
    },
  );
});
