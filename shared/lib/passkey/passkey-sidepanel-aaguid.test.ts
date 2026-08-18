import {
  normalizePasskeyAaguid,
  isPasskeyAaguidIncompatibleWithSidepanel,
  getPasskeyAuthenticatorName,
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

describe('getPasskeyAuthenticatorName', () => {
  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4', 'google_password_manager'],
    ['08987058-cadc-4b81-b6e1-30de50dcbe96', 'windows_hello'],
    ['dd4ec289-e01d-41c9-bb89-70fa845d4bf2', 'apple'],
    ['bada5566-a7aa-401f-bd96-45619a55120d', 'onepassword'],
  ])('maps %s to %s', (aaguid: string, expectedName: string) => {
    expect(getPasskeyAuthenticatorName(aaguid)).toBe(expectedName);
  });

  it('returns unknown for an unrecognized or missing AAGUID', () => {
    expect(
      getPasskeyAuthenticatorName('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
    ).toBe('unknown');
    expect(getPasskeyAuthenticatorName(undefined)).toBe('unknown');
  });
});
