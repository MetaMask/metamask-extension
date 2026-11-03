import {
  MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME,
  getMoneyAccountChompConfig,
  parseMoneyAccountChompConfig,
} from './chomp-config';

const VALID_CONFIG = { baseUrl: 'https://chomp.api.cx.metamask.io' };

const NON_OBJECT_FLAGS: [string, unknown][] = [
  ['a string', 'https://chomp.api.cx.metamask.io'],
  ['a number', 42],
  ['null', null],
  ['undefined', undefined],
  ['an array', [VALID_CONFIG]],
];

const INVALID_BASE_URLS: [string, unknown][] = [
  ['is missing', undefined],
  ['is not a string', 42],
  ['is null', null],
  ['is empty', ''],
  ['is not a valid URL', 'not-a-url'],
];

describe('parseMoneyAccountChompConfig', () => {
  it('parses a well-formed config', () => {
    expect(parseMoneyAccountChompConfig(VALID_CONFIG)).toStrictEqual(
      VALID_CONFIG,
    );
  });

  it('ignores unknown extra fields', () => {
    expect(
      parseMoneyAccountChompConfig({ ...VALID_CONFIG, someFutureField: 1 }),
    ).toStrictEqual(VALID_CONFIG);
  });

  for (const [description, raw] of NON_OBJECT_FLAGS) {
    it(`rejects a config that is ${description}`, () => {
      expect(parseMoneyAccountChompConfig(raw)).toBeUndefined();
    });
  }

  for (const [description, baseUrl] of INVALID_BASE_URLS) {
    it(`rejects a config whose base URL ${description}`, () => {
      expect(parseMoneyAccountChompConfig({ baseUrl })).toBeUndefined();
    });
  }
});

describe('getMoneyAccountChompConfig', () => {
  it('reads the config from the flag', () => {
    expect(
      getMoneyAccountChompConfig({
        [MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME]: VALID_CONFIG,
      }),
    ).toStrictEqual(VALID_CONFIG);
  });

  it('returns undefined when the flag is unserved', () => {
    expect(getMoneyAccountChompConfig({})).toBeUndefined();
    expect(getMoneyAccountChompConfig(undefined)).toBeUndefined();
  });
});
