import {
  getMoneyAccountVaultConfig,
  parseMoneyAccountVaultConfig,
} from './vault-config';

const VALID_CONFIG = {
  chainId: '0x8f',
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
} as const;

const ADDRESS_KEYS = [
  'boringVault',
  'tellerAddress',
  'accountantAddress',
  'lensAddress',
  'underlyingToken',
] as const;

const INVALID_CHAIN_IDS: [string, unknown][] = [
  ['is not prefixed', '8f'],
  ['has non-hex digits', '0xmonad'],
  ['is missing', undefined],
  ['is a number', 143],
  ['is null', null],
  ['is empty', ''],
];

const INVALID_ADDRESSES: [string, unknown][] = [
  ['is not hex', 'not-an-address'],
  ['is truncated', '0xb4563bcD3B7764CCBf497f5'],
  // A valid address but with its final byte upper-cased: still 20 hex bytes,
  // but no longer a valid ERC-55 checksum.
  ['has a bad ERC-55 checksum', '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5AE'],
  ['is missing', undefined],
  ['is not a string', 1234],
  ['is null', null],
  ['is empty', ''],
];

const NON_OBJECT_FLAGS: [string, unknown][] = [
  ['a string', 'moneyAccountVaultConfig'],
  ['a number', 1],
  ['null', null],
  ['undefined', undefined],
  ['an array', [VALID_CONFIG]],
  ['an empty object', {}],
];

describe('parseMoneyAccountVaultConfig', () => {
  it('parses a well-formed config', () => {
    expect(parseMoneyAccountVaultConfig(VALID_CONFIG)).toStrictEqual(
      VALID_CONFIG,
    );
  });

  it('passes checksummed addresses through unchanged, without normalising', () => {
    const parsed = parseMoneyAccountVaultConfig(VALID_CONFIG);

    expect(parsed?.boringVault).toBe(VALID_CONFIG.boringVault);
    expect(parsed?.tellerAddress).toBe(VALID_CONFIG.tellerAddress);
    expect(parsed?.accountantAddress).toBe(VALID_CONFIG.accountantAddress);
    expect(parsed?.lensAddress).toBe(VALID_CONFIG.lensAddress);
    expect(parsed?.underlyingToken).toBe(VALID_CONFIG.underlyingToken);
  });

  it('accepts all-lowercase addresses', () => {
    const lowercased = {
      ...VALID_CONFIG,
      boringVault: VALID_CONFIG.boringVault.toLowerCase(),
    };

    expect(parseMoneyAccountVaultConfig(lowercased)).toStrictEqual(lowercased);
  });

  it('ignores unknown extra fields', () => {
    expect(
      parseMoneyAccountVaultConfig({ ...VALID_CONFIG, someFutureField: 1 }),
    ).toStrictEqual(VALID_CONFIG);
  });

  for (const [description, chainId] of INVALID_CHAIN_IDS) {
    it(`rejects a config whose chain id ${description}`, () => {
      expect(
        parseMoneyAccountVaultConfig({ ...VALID_CONFIG, chainId }),
      ).toBeUndefined();
    });
  }

  for (const key of ADDRESS_KEYS) {
    for (const [description, value] of INVALID_ADDRESSES) {
      it(`rejects a config whose ${key} ${description}`, () => {
        expect(
          parseMoneyAccountVaultConfig({ ...VALID_CONFIG, [key]: value }),
        ).toBeUndefined();
      });
    }
  }

  for (const [description, raw] of NON_OBJECT_FLAGS) {
    it(`rejects a flag that is ${description}`, () => {
      expect(parseMoneyAccountVaultConfig(raw)).toBeUndefined();
    });
  }
});

describe('getMoneyAccountVaultConfig', () => {
  it('parses the config out of the remote feature flags', () => {
    expect(
      getMoneyAccountVaultConfig({
        moneyAccountVaultConfig: { ...VALID_CONFIG },
      }),
    ).toStrictEqual(VALID_CONFIG);
  });

  it('returns undefined when the flag is unserved', () => {
    expect(getMoneyAccountVaultConfig({})).toBeUndefined();
  });

  it('returns undefined when there are no flags at all', () => {
    expect(getMoneyAccountVaultConfig(undefined)).toBeUndefined();
  });

  it('returns undefined when the flag is malformed', () => {
    expect(
      getMoneyAccountVaultConfig({
        moneyAccountVaultConfig: { ...VALID_CONFIG, lensAddress: '0x0' },
      }),
    ).toBeUndefined();
  });
});
