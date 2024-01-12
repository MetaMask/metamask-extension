import { migrate, version } from './103';

describe(`migration #${version}`, () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: version - 1,
      },
      data: {},
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version,
    });
  });

  it('should return state unaltered if browser is firefox', async () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
      );

    const oldData = {
      other: 'data',
    };
    const oldStorage = {
      meta: {
        version: version - 1,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual(oldData);
  });

  it('should return state with ledgerTransportType to be webhid if the useragent is Chrome', async () => {
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
      );
    const oldData = {
      other: 'data',
      PreferencesController: {
        ledgerTransportType: 'u2f',
      },
    };
    const oldStorage = {
      meta: {
        version: version - 1,
      },
      data: oldData,
    };

    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      other: 'data',
      PreferencesController: {
        ledgerTransportType: 'webhid',
      },
    });
  });
});
