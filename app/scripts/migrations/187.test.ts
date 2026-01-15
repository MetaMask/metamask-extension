import { migrate, version } from './187';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #187', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const storage = {
      meta: { version: 186 },
      data: {},
    };

    await migrate(storage, new Set());

    expect(storage.meta).toStrictEqual({ version });
  });

  describe('when `pna25Acknowledged` is `false`', () => {
    it('does not set `initialDelayEndTimestamp` if it does not exist', async () => {
      const changedKeys = new Set<string>();
      const storage = {
        meta: { version: 186 },
        data: {
          AppStateController: {
            pna25Acknowledged: false,
          },
          ProfileMetricsController: {},
        },
      };

      await migrate(storage, changedKeys);

      expect(storage.data.ProfileMetricsController).toStrictEqual({});
      expect(changedKeys.has('ProfileMetricsController')).toBe(false);
    });

    it('does not overwrite existing `initialDelayEndTimestamp`', async () => {
      const changedKeys = new Set<string>();
      const existingTimestamp = 1620000000000;
      const storage = {
        meta: { version: 186 },
        data: {
          AppStateController: {
            pna25Acknowledged: false,
          },
          ProfileMetricsController: {
            initialDelayEndTimestamp: existingTimestamp,
          },
        },
      };

      await migrate(storage, changedKeys);

      expect(storage.data.ProfileMetricsController).toStrictEqual({
        initialDelayEndTimestamp: existingTimestamp,
      });
    });
  });

  describe('when `pna25Acknowledged` is `true`', () => {
    it('sets `initialDelayEndTimestamp` to current time if it does not exist', async () => {
      const changedKeys = new Set<string>();
      const storage = {
        meta: { version: 186 },
        data: {
          AppStateController: {
            pna25Acknowledged: true,
          },
          ProfileMetricsController: {},
        },
      };

      const beforeMigrationTime = Date.now();
      await migrate(storage, changedKeys);
      const afterMigrationTime = Date.now();

      const { initialDelayEndTimestamp } = storage.data
        .ProfileMetricsController as {
        initialDelayEndTimestamp: number;
      };

      expect(initialDelayEndTimestamp).toBeDefined();
      expect(initialDelayEndTimestamp).toBeGreaterThanOrEqual(
        beforeMigrationTime,
      );
      expect(initialDelayEndTimestamp).toBeLessThanOrEqual(afterMigrationTime);
      expect(changedKeys.has('ProfileMetricsController')).toBe(true);
    });

    it('does not overwrite existing `initialDelayEndTimestamp`', async () => {
      const changedKeys = new Set<string>();
      const existingTimestamp = 1620000000000;
      const storage = {
        meta: { version: 186 },
        data: {
          AppStateController: {
            pna25Acknowledged: true,
          },
          ProfileMetricsController: {
            initialDelayEndTimestamp: existingTimestamp,
          },
        },
      };

      migrate(storage, changedKeys);

      expect(storage.data.ProfileMetricsController).toStrictEqual({
        initialDelayEndTimestamp: existingTimestamp,
      });
      expect(changedKeys.has('ProfileMetricsController')).toBe(false);
    });
  });
});
