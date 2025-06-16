import { SnapEndowments } from '@metamask/snaps-rpc-methods';

import { SnapCaveatType } from '@metamask/snaps-utils';
import { Duration, inMilliseconds } from '@metamask/utils';
import { migrate, version } from './165';

const oldVersion = 164;

const MOCK_SNAP_ID = 'npm:foo-snap';
const MOCK_ORIGIN = 'http://example.com';

jest.useFakeTimers();
jest.setSystemTime(new Date('2023-10-01T00:00:00Z').getTime());

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('transformState', () => {
    it('adds cronjobs to the `events` property and deletes the `jobs` property', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CronjobController: {
            jobs: {
              [`${MOCK_SNAP_ID}-0`]: {
                lastRun: Date.now() - inMilliseconds(1, Duration.Day),
              },
              [`${MOCK_SNAP_ID}-1`]: {
                lastRun: Date.now() - inMilliseconds(1, Duration.Day),
              },
            },
            events: {},
          },

          PermissionController: {
            subjects: {
              [MOCK_SNAP_ID]: {
                origin: MOCK_SNAP_ID,
                permissions: {
                  [SnapEndowments.Cronjob]: {
                    caveats: [
                      {
                        type: SnapCaveatType.SnapCronjob,
                        value: {
                          jobs: [
                            {
                              expression: '*/30 * * * * *',
                              request: {
                                method: 'foo',
                                params: { bar: 'baz' },
                              },
                            },
                            {
                              expression: '0 0 0 * 11 *',
                              request: {
                                method: 'foo',
                                params: { bar: 'baz' },
                              },
                            },
                          ],
                        },
                      },
                    ],
                    date: 1664187844588,
                    id: 'izn0WGUO8cvq_jqvLQuQP',
                    invoker: MOCK_ORIGIN,
                    parentCapability: SnapEndowments.EthereumProvider,
                  },
                },
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data.CronjobController).toStrictEqual({
        events: {
          [`cronjob-${MOCK_SNAP_ID}-0`]: {
            id: `cronjob-${MOCK_SNAP_ID}-0`,
            recurring: true,
            date: '2023-09-30T23:59:00.000Z',
            schedule: '*/30 * * * * *',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            snapId: MOCK_SNAP_ID,
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
          },
          [`cronjob-${MOCK_SNAP_ID}-1`]: {
            id: `cronjob-${MOCK_SNAP_ID}-1`,
            recurring: true,
            date: '2023-11-01T00:00:00.000Z',
            schedule: '0 0 0 * 11 *',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            snapId: MOCK_SNAP_ID,
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
          },
        },
      });
    });

    it("works if the state doesn't have an `events` property", async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CronjobController: {
            jobs: {
              [`${MOCK_SNAP_ID}-0`]: {
                lastRun: Date.now() - inMilliseconds(1, Duration.Day),
              },
              [`${MOCK_SNAP_ID}-1`]: {
                lastRun: Date.now() - inMilliseconds(1, Duration.Day),
              },
            },
          },

          PermissionController: {
            subjects: {
              [MOCK_SNAP_ID]: {
                origin: MOCK_SNAP_ID,
                permissions: {
                  [SnapEndowments.Cronjob]: {
                    caveats: [
                      {
                        type: SnapCaveatType.SnapCronjob,
                        value: {
                          jobs: [
                            {
                              expression: '*/30 * * * * *',
                              request: {
                                method: 'foo',
                                params: { bar: 'baz' },
                              },
                            },
                            {
                              expression: '0 0 0 * 11 *',
                              request: {
                                method: 'foo',
                                params: { bar: 'baz' },
                              },
                            },
                          ],
                        },
                      },
                    ],
                    date: 1664187844588,
                    id: 'izn0WGUO8cvq_jqvLQuQP',
                    invoker: MOCK_ORIGIN,
                    parentCapability: SnapEndowments.EthereumProvider,
                  },
                },
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data.CronjobController).toStrictEqual({
        events: {
          [`cronjob-${MOCK_SNAP_ID}-0`]: {
            id: `cronjob-${MOCK_SNAP_ID}-0`,
            recurring: true,
            date: '2023-09-30T23:59:00.000Z',
            schedule: '*/30 * * * * *',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            snapId: MOCK_SNAP_ID,
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
          },
          [`cronjob-${MOCK_SNAP_ID}-1`]: {
            id: `cronjob-${MOCK_SNAP_ID}-1`,
            recurring: true,
            date: '2023-11-01T00:00:00.000Z',
            schedule: '0 0 0 * 11 *',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            snapId: MOCK_SNAP_ID,
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
          },
        },
      });
    });

    it('updates legacy events in the `events` property', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CronjobController: {
            jobs: {},
            events: {
              foo: {
                id: 'foo',
                snapId: MOCK_SNAP_ID,
                date: '2023-09-30T23:59:00.000Z',
                scheduledAt: '2023-10-01T00:00:00.000Z',
                request: {
                  method: 'foo',
                  params: { bar: 'baz' },
                },
              },
            },
          },

          PermissionController: {
            subjects: {},
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data.CronjobController).toStrictEqual({
        events: {
          foo: {
            id: 'foo',
            snapId: MOCK_SNAP_ID,
            date: '2023-09-30T23:59:00.000Z',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
            recurring: false,
            schedule: '2023-09-30T23:59:00.000Z',
          },
        },
      });
    });

    it('combines legacy jobs and events into the `events` property', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          CronjobController: {
            jobs: {
              [`${MOCK_SNAP_ID}-0`]: {
                lastRun: Date.now() - inMilliseconds(1, Duration.Day),
              },
            },
            events: {
              foo: {
                id: 'foo',
                snapId: MOCK_SNAP_ID,
                date: '2023-09-30T23:59:00.000Z',
                scheduledAt: '2023-10-01T00:00:00.000Z',
                request: {
                  method: 'foo',
                  params: { bar: 'baz' },
                },
              },
            },
          },

          PermissionController: {
            subjects: {
              [MOCK_SNAP_ID]: {
                origin: MOCK_SNAP_ID,
                permissions: {
                  [SnapEndowments.Cronjob]: {
                    caveats: [
                      {
                        type: SnapCaveatType.SnapCronjob,
                        value: {
                          jobs: [
                            {
                              expression: '*/30 * * * * *',
                              request: {
                                method: 'foo',
                                params: { bar: 'baz' },
                              },
                            },
                          ],
                        },
                      },
                    ],
                    date: 1664187844588,
                    id: 'izn0WGUO8cvq_jqvLQuQP',
                    invoker: MOCK_ORIGIN,
                    parentCapability: SnapEndowments.EthereumProvider,
                  },
                },
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data.CronjobController).toStrictEqual({
        events: {
          foo: {
            id: 'foo',
            snapId: MOCK_SNAP_ID,
            date: '2023-09-30T23:59:00.000Z',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
            recurring: false,
            schedule: '2023-09-30T23:59:00.000Z',
          },
          [`cronjob-${MOCK_SNAP_ID}-0`]: {
            id: `cronjob-${MOCK_SNAP_ID}-0`,
            recurring: true,
            date: '2023-09-30T23:59:00.000Z',
            schedule: '*/30 * * * * *',
            scheduledAt: '2023-10-01T00:00:00.000Z',
            snapId: MOCK_SNAP_ID,
            request: {
              method: 'foo',
              params: { bar: 'baz' },
            },
          },
        },
      });
    });
  });
});
