import migration38 from './038';

type MigrationInput = Parameters<typeof migration38.migrate>[0];

type AbTestControllerFixture = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ABTestController?: {
    abTests?: { fullScreenVsPopup?: string };
  };
};

describe('migration #38', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 37,
      },
      data: {},
    };

    const newStorage = await migration38.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta.version).toStrictEqual(38);
  });

  it('should add a fullScreenVsPopup property set to either "control" or "fullScreen"', async () => {
    const oldStorage = {
      meta: { version: 37 },
      data: {},
    };

    const newStorage = await migration38.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      (newStorage.data as AbTestControllerFixture).ABTestController?.abTests
        ?.fullScreenVsPopup,
    ).toStrictEqual('control');
  });

  it('should leave the fullScreenVsPopup property unchanged if it exists', async () => {
    const oldStorage = {
      meta: { version: 37 },
      data: {
        ABTestController: {
          abTests: {
            fullScreenVsPopup: 'fullScreen',
          },
        },
      },
    };

    const newStorage = await migration38.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(
      (newStorage.data as AbTestControllerFixture).ABTestController?.abTests
        ?.fullScreenVsPopup,
    ).toStrictEqual('fullScreen');
  });
});
