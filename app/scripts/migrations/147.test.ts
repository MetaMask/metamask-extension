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

  it('returns state unchanged if AuthenticationController is missing', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {
        SomeOtherController: {
          someData: 'value',
        },
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('returns state unchanged if AuthenticationController is not an object', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {
        // @ts-expect-error - intentionally testing invalid state
        AuthenticationController: 'invalid',
      },
    };
    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
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

    it('does not modify state if AuthenticationController exists without old sessionData', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          AuthenticationController: {
            isSignedIn: true,
          },
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does not modify state if sessionData does not have accessToken', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          AuthenticationController: {
            isSignedIn: true,
            sessionData: {
              // New sessionData shape without accessToken
              profile: {
                identifierId: 'identifierId',
                profileId: 'profileId',
              },
              // @ts-expect-error - intentionally testing different state shape
              otherData: 'value',
            },
          },
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });
  });
});
