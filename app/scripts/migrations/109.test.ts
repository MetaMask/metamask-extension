import {
  FALLBACK_VARIATION,
  NameOrigin,
  NameType,
} from '@metamask/name-controller';
import { migrate, version } from './109';

const oldVersion = 108;

const ADDRESS_1 = '0xc0ffee254729296a45a3885639AC7E10F9d54979';
const NAME_1 = 'TestName1';
const ADDRESS_2 = '0xc0ffee254729296a45a3885639AC7E10F9d54978';
const NAME_2 = 'TestName2';
const ADDRESS_3 = '0xc0ffee254729296a45a3885639AC7E10F9d54977';
const NAME_3 = 'TestName3';

describe('migration #108', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if no preferences state', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('does nothing if no account id entries', async () => {
    const oldState = {
      OtherController: {},
      PreferencesController: {
        identities: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('adds name entries', async () => {
    const oldState = {
      OtherController: {},
      PreferencesController: {
        identities: {
          [ADDRESS_1]: {
            name: NAME_1,
            address: ADDRESS_1,
          },
          [ADDRESS_2]: {
            name: NAME_2,
            address: ADDRESS_2,
          },
          [ADDRESS_3]: {
            name: NAME_3,
            address: ADDRESS_3,
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_1.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_1,
                sourceId: null,
                proposedNames: {},
                origin: NameOrigin.ACCOUNT_IDENTITY,
              },
            },
            [ADDRESS_2.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_2,
                sourceId: null,
                proposedNames: {},
                origin: NameOrigin.ACCOUNT_IDENTITY,
              },
            },
            [ADDRESS_3.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_3,
                sourceId: null,
                proposedNames: {},
                origin: NameOrigin.ACCOUNT_IDENTITY,
              },
            },
          },
        },
      },
    });
  });

  it('keeps existing name entries', async () => {
    const oldState = {
      OtherController: {},
      PreferencesController: {
        identities: {
          [ADDRESS_1]: {
            name: NAME_1,
            address: ADDRESS_1,
          },
        },
      },
      NameController: {
        names: {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_2.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_2,
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_1.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_1,
                sourceId: null,
                proposedNames: {},
                origin: NameOrigin.ACCOUNT_IDENTITY,
              },
            },
            [ADDRESS_2.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_2,
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    });
  });

  it('ignores account id entry if existing petname', async () => {
    const oldState = {
      OtherController: {},
      PreferencesController: {
        identities: {
          [ADDRESS_1]: {
            name: NAME_1,
            address: ADDRESS_1,
          },
        },
      },
      NameController: {
        names: {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_1.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_2,
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_1.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_2,
                sourceId: 'ens',
                proposedNames: {},
              },
            },
          },
        },
      },
    });
  });

  it('ignores account id entry if no name or address', async () => {
    const oldState = {
      OtherController: {},
      PreferencesController: {
        identities: {
          [ADDRESS_1]: {
            name: NAME_1,
            address: '',
          },
          [ADDRESS_2]: {
            name: '',
            address: ADDRESS_2,
          },
          [ADDRESS_3]: {
            name: NAME_3,
            address: ADDRESS_3,
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual({
      ...oldState,
      NameController: {
        names: {
          [NameType.ETHEREUM_ADDRESS]: {
            [ADDRESS_3.toLowerCase()]: {
              [FALLBACK_VARIATION]: {
                name: NAME_3,
                sourceId: null,
                proposedNames: {},
                origin: NameOrigin.ACCOUNT_IDENTITY,
              },
            },
          },
        },
      },
    });
  });

  it('does not modify state if there are no changes.', async () => {
    const oldState = {
      OtherController: {},
      PreferencesController: {
        identities: {
          [ADDRESS_1]: {
            name: NAME_1,
            address: '',
          },
          [ADDRESS_2]: {
            name: '',
            address: ADDRESS_2,
          },
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });
});
