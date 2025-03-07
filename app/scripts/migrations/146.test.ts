import { migrate, version, VersionedData } from './146';

const oldVersion = 145;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage: VersionedData = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    it('resets sessionData if using the old state shape', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {
          AuthenticationController: {
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
          sessionData: undefined,
        },
      };
      const newStorage = await migrate(oldStorage);

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
