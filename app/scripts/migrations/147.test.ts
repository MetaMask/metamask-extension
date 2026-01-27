import { migrate, version, VersionedData } from './147';

const oldVersion = 146;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if AuthenticationController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({});
  });

  it('does nothing if AuthenticationController is undefined', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {
        AuthenticationController: undefined,
      },
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.data).toStrictEqual({
      AuthenticationController: undefined,
    });
  });

  describe(`migration #${version}`, () => {
    it('resets sessionData if using the old state shape', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          AuthenticationController: {
            isSignedIn: true,
            sessionData: {
              accessToken: 'accessToken',
              expiresIn: '',
              profile: {
                identifierId: 'identifierId',
                profileId: 'profileId',
              },
            },
          },
        },
      };
      const expectedData = {
        AuthenticationController: {
          isSignedIn: false,
          sessionData: undefined,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
