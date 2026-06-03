import { migrate, version } from './148';

const oldVersion = 148;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe(`migration #${version}`, () => {
    describe('removes the transactionSecurityCheckEnabled preference from the PreferencesController', () => {
      it('removes the transactionSecurityCheckEnabled preference if it is set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            PreferencesController: {
              preferences: {
                transactionSecurityCheckEnabled: true,
              },
            },
          },
        };
        const expectedData = {
          PreferencesController: {
            preferences: {},
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });

      it('does nothing to other PreferencesController state if there is not a transactionSecurityCheckEnabled preference', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            PreferencesController: {
              existingPreference: true,
            },
          },
        };
        const expectedData = {
          PreferencesController: {
            existingPreference: true,
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });
    });

    describe('removes the useRequestQueue preference from the PreferencesController', () => {
      it('removes the useRequestQueue preference if it is set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            PreferencesController: {
              preferences: {
                useRequestQueue: true,
              },
            },
          },
        };
        const expectedData = {
          PreferencesController: {
            preferences: {},
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });

      it('does nothing to other PreferencesController state if there is not a useRequestQueue preference', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            PreferencesController: {
              existingPreference: true,
            },
          },
        };
        const expectedData = {
          PreferencesController: {
            existingPreference: true,
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });
    });

    describe('removes the collectibles property from the NftController', () => {
      it('removes the collectibles property if it is set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            NftController: {
              collectibles: true,
            },
          },
        };
        const expectedData = {
          NftController: {},
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });

      it('it does nothing to other state if the collectibles property is not set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            NftController: {
              existingProperty: true,
            },
          },
        };
        const expectedData = {
          NftController: {
            existingProperty: true,
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });
    });

    describe('removes the collectibleContracts property from the NftController', () => {
      it('removes the collectibleContracts property if it is set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            NftController: {
              collectibleContracts: true,
            },
          },
        };
        const expectedData = {
          NftController: {},
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });

      it('it does nothing to other state if the collectibleContracts property is not set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            NftController: {
              existingProperty: true,
            },
          },
        };
        const expectedData = {
          NftController: {
            existingProperty: true,
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });
    });

    describe('removes the enableEIP1559V2NoticeDismissed property from the AppStateController', () => {
      it('removes the enableEIP1559V2NoticeDismissed property if it is set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            AppStateController: {
              enableEIP1559V2NoticeDismissed: true,
            },
          },
        };
        const expectedData = {
          AppStateController: {},
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });

      it('it does nothing to other state if the enableEIP1559V2NoticeDismissed property is not set', async () => {
        const oldStorage = {
          meta: { version: oldVersion },
          data: {
            AppStateController: {
              existingProperty: true,
            },
          },
        };
        const expectedData = {
          AppStateController: {
            existingProperty: true,
          },
        };

        const newStorage = await migrate(oldStorage);

        expect(newStorage.data).toStrictEqual(expectedData);
      });
    });
  });
});
