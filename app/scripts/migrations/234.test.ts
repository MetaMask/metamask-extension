import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';
import { migrate, version } from './234';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockedCaptureException = jest.mocked(captureException);

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

const createMoneyAccount = () => ({
  id: 'money-account-id',
  type: 'eip155:eoa',
  address: '0xabcdef1234567890abcdef1234567890abcdef12',
  scopes: ['eip155:0'],
  options: {
    entropy: {
      type: 'mnemonic',
      id: 'entropy-source-1',
      groupIndex: 0,
      derivationPath: "m/44'/4392018'/0'/0",
    },
    exportable: false,
  },
  methods: ['personal_sign'],
});

const createState = (moneyAccountController: unknown): VersionedData => ({
  meta: { version: OLD_VERSION },
  data: {
    MoneyAccountController: moneyAccountController,
    OtherController: { preserved: true },
  },
});

const getMoneyAccountController = (state: VersionedData) =>
  state.data.MoneyAccountController as {
    moneyAccounts?: unknown;
    defaultMoneyAccountId?: unknown;
  };

describe(`migration #${VERSION}`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bumps the version', async () => {
    const oldStorage = createState({ moneyAccounts: {} });

    await migrate(oldStorage, new Set<string>());

    expect(oldStorage.meta.version).toBe(VERSION);
  });

  it('backfills defaultMoneyAccountId to the sole money account', async () => {
    const oldStorage = createState({
      moneyAccounts: {
        'money-account-id': createMoneyAccount(),
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(getMoneyAccountController(oldStorage)).toStrictEqual({
      moneyAccounts: {
        'money-account-id': createMoneyAccount(),
      },
      defaultMoneyAccountId: 'money-account-id',
    });
    expect(changedControllers).toStrictEqual(
      new Set(['MoneyAccountController']),
    );
  });

  it('preserves unrelated persisted state when backfilling', async () => {
    const oldStorage = createState({
      moneyAccounts: {
        'money-account-id': createMoneyAccount(),
      },
    });

    await migrate(oldStorage, new Set<string>());

    expect(oldStorage.data.OtherController).toStrictEqual({ preserved: true });
  });

  it('leaves the state untouched when moneyAccounts is empty', async () => {
    const oldStorage = createState({ moneyAccounts: {} });
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('leaves the state untouched when defaultMoneyAccountId is already set', async () => {
    const oldStorage = createState({
      moneyAccounts: {
        'money-account-id': createMoneyAccount(),
      },
      defaultMoneyAccountId: 'money-account-id',
    });
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('leaves the state untouched when there is more than one money account', async () => {
    const oldStorage = createState({
      moneyAccounts: {
        'money-account-1': createMoneyAccount(),
        'money-account-2': createMoneyAccount(),
      },
    });
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('leaves the state untouched when MoneyAccountController is absent', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: {
        OtherController: { preserved: true },
      },
    };
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each([null, 'invalid'])(
    'captures an exception when MoneyAccountController is %p',
    async (moneyAccountController: null | string) => {
      const oldStorage = createState(moneyAccountController);
      const before = cloneDeep(oldStorage);
      const changedControllers = new Set<string>();

      await migrate(oldStorage, changedControllers);

      expect(oldStorage.data).toStrictEqual(before.data);
      expect(changedControllers).toStrictEqual(new Set());
      expect(mockedCaptureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${VERSION}: Invalid MoneyAccountController state: '${typeof moneyAccountController}'`,
        ),
      );
    },
  );

  it('captures an exception when moneyAccounts is missing', async () => {
    const oldStorage = createState({});
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: Missing moneyAccounts property from MoneyAccountController`,
      ),
    );
  });

  it('captures an exception when moneyAccounts is invalid', async () => {
    const oldStorage = createState({ moneyAccounts: null });
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(`Migration ${VERSION}: Invalid moneyAccounts state: 'object'`),
    );
  });
});
