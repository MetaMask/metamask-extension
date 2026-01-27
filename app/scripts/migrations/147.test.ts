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

    it('logs warning and returns state unchanged when AuthenticationController is invalid', async () => {
      const oldStorage: VersionedData = {
        meta: { version: oldVersion },
        data: {},
      };

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const newStorage = await migrate(oldStorage);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `Migration ${version}: Invalid AuthenticationController state: undefined`,
      );
      expect(newStorage.data).toStrictEqual(oldStorage.data);

      consoleWarnSpy.mockRestore();
    });
  });
});
