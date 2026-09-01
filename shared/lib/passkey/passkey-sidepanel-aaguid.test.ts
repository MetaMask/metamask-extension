import {
  normalizePasskeyAaguid,
  isPasskeyAaguidIncompatibleWithSidepanel,
} from './passkey-sidepanel-aaguid';

/** Must match private Google Password Manager AAGUID in passkey-sidepanel-aaguid.ts */
const GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID =
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';

describe('normalizePasskeyAaguid', () => {
  it('returns lowercase trimmed UUID', () => {
    expect(
      normalizePasskeyAaguid('  EA9B8D66-4D01-1D21-3CE4-B6B48CB575D4  '),
    ).toBe(GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID);
  });

  it('returns null for missing or whitespace-only', () => {
    expect(normalizePasskeyAaguid('')).toBeNull();
    expect(normalizePasskeyAaguid('   ')).toBeNull();
    expect(normalizePasskeyAaguid(null)).toBeNull();
    expect(normalizePasskeyAaguid(undefined)).toBeNull();
  });

  it('returns trimmed lowercase for any non-empty string', () => {
    expect(normalizePasskeyAaguid('not-a-uuid')).toBe('not-a-uuid');
    expect(normalizePasskeyAaguid('  Foo  ')).toBe('foo');
  });
});

describe('isPasskeyAaguidIncompatibleWithSidepanel', () => {
  it('returns true for Google Password Manager AAGUID', () => {
    expect(
      isPasskeyAaguidIncompatibleWithSidepanel(
        GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID,
      ),
    ).toBe(true);
  });

  it('returns false for unknown AAGUID', () => {
    expect(
      isPasskeyAaguidIncompatibleWithSidepanel(
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      ),
    ).toBe(false);
  });

  it('returns false for all-zero AAGUID', () => {
    expect(
      isPasskeyAaguidIncompatibleWithSidepanel(
        '00000000-0000-0000-0000-000000000000',
      ),
    ).toBe(false);
  });

  it('returns false for missing aaguid', () => {
    expect(isPasskeyAaguidIncompatibleWithSidepanel(undefined)).toBe(false);
  });

  it('returns false for non-list string', () => {
    expect(isPasskeyAaguidIncompatibleWithSidepanel('not-a-uuid')).toBe(false);
  });
});
