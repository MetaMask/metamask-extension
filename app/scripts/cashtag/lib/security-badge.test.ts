import { it } from '@jest/globals';
import { IconColor, IconName } from '@metamask/design-system-react';
import { getSecurityStatusBadge } from './security-badge';

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
