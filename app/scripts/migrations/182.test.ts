import { migrate, version } from './182';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

describe('migration #182', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 181 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('removes pinned and hidden from each account group metadata', async () => {
    const oldStorage: {
      meta: { version: number };
      data: Record<string, unknown>;
    } = {
      meta: { version: 181 },
      data: {
        AccountTreeController: {
          accountGroupsMetadata: {
            groupA: { pinned: true, hidden: true, label: 'Group A' },
            groupB: { pinned: false, label: 'Group B' },
            groupC: { hidden: false, label: 'Group C' },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    const metadata = (
      newStorage.data as Record<
        'AccountTreeController',
        {
          accountGroupsMetadata: Record<
            string,
            { label: string; pinned?: boolean; hidden?: boolean }
          >;
        }
      >
    ).AccountTreeController.accountGroupsMetadata;

    expect(metadata.groupA).toEqual({ label: 'Group A' });
    expect(metadata.groupB).toEqual({ label: 'Group B' });
    expect(metadata.groupC).toEqual({ label: 'Group C' });

    // Ensure properties were actually removed (not just falsy)
    expect('pinned' in metadata.groupA).toBe(false);
    expect('hidden' in metadata.groupA).toBe(false);
    expect('pinned' in metadata.groupB).toBe(false);
    expect('hidden' in metadata.groupB).toBe(false);
    expect('pinned' in metadata.groupC).toBe(false);
    expect('hidden' in metadata.groupC).toBe(false);
  });

  it('does nothing if AccountTreeController state is missing', async () => {
    const oldStorage: {
      meta: { version: number };
      data: Record<string, unknown>;
    } = {
      meta: { version: 181 },
      data: {
        SomeOtherController: {
          foo: 'bar',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    const someOtherController = (
      newStorage.data as Record<'SomeOtherController', { foo: string }>
    ).SomeOtherController;
    expect(someOtherController).toEqual({ foo: 'bar' });
    expect(newStorage.meta.version).toBe(version);
  });
});
