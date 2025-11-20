import { migrate, version } from './182';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

const oldVersion = 182;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
    // Mock process.env to allow migration logic to run
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('updates the meta.storageKind property', async () => {
    const storage = {
      meta: { version: oldVersion } as {
        version: number;
        storageKind?: string;
      },
      data: {},
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(storage);

    expect(newStorage).toStrictEqual(undefined);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${version}: NetworkController not found.`,
    );
    expect(storage.meta.storageKind).toStrictEqual('data');
  });
});
