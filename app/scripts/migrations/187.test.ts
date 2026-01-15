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
    const oldStorage = {
      meta: { version: 186 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('when `pna25Acknowledged` is `false`', () => {
    it('does not set `initialDelayEndTimestamp` if it does not exist', async () => {
      const oldStorage = {
        meta: { version: 186 },
        data: {
          AppStateController: {
            pna25Acknowledged: false,
          },
          ProfileMetricsController: {},
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data.ProfileMetricsController).toStrictEqual({});
    });

    it('does not overwrite existing `initialDelayEndTimestamp`', async () => {
      const existingTimestamp = 1620000000000;
      const oldStorage = {
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

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data.ProfileMetricsController).toStrictEqual({
        initialDelayEndTimestamp: existingTimestamp,
      });
    });
  });

  describe('when `pna25Acknowledged` is `true`', () => {
    it('sets `initialDelayEndTimestamp` to current time if it does not exist', async () => {
      const oldStorage = {
        meta: { version: 186 },
        data: {
          AppStateController: {
            pna25Acknowledged: true,
          },
          ProfileMetricsController: {},
        },
      };

      const beforeMigrationTime = Date.now();
      const newStorage = await migrate(oldStorage);
      const afterMigrationTime = Date.now();

      const { initialDelayEndTimestamp } = newStorage.data
        .ProfileMetricsController as {
        initialDelayEndTimestamp: number;
      };

      expect(initialDelayEndTimestamp).toBeDefined();
      expect(initialDelayEndTimestamp).toBeGreaterThanOrEqual(
        beforeMigrationTime,
      );
      expect(initialDelayEndTimestamp).toBeLessThanOrEqual(afterMigrationTime);
    });

    it('does not overwrite existing `initialDelayEndTimestamp`', async () => {
      const existingTimestamp = 1620000000000;
      const oldStorage = {
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

      const newStorage = await migrate(oldStorage);

      expect(newStorage.data.ProfileMetricsController).toStrictEqual({
        initialDelayEndTimestamp: existingTimestamp,
      });
    });
  });
});
