import { migrate, version } from './175';

const oldVersion = 173;
const newVersion = version;

describe('migration #174', () => {
  it('updates the version metadata', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {},
    };

    const newState = await migrate(oldState);
    expect(newState.meta.version).toBe(newVersion);
  });

  it('adds default avatarType to preferences when missing', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useBlockie: false,
          preferences: {},
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data.PreferencesController).toStrictEqual({
      useBlockie: false,
      preferences: {
        avatarType: 'maskicon',
      },
    });
  });

  it('sets avatarType to blockies when useBlockie is true', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useBlockie: true,
          preferences: {},
        },
      },
    };

    const newState = await migrate(oldState);

    expect(newState.data.PreferencesController).toStrictEqual({
      useBlockie: true,
      preferences: {
        avatarType: 'blockies',
      },
    });
  });

  it('does not overwrite existing avatarType', async () => {
    const oldState = {
      meta: { version: oldVersion },
      data: {
        PreferencesController: {
          useBlockie: false,
          preferences: {
            avatarType: 'jazzicon',
          },
        },
      },
    };

    const newState = await migrate(oldState);
    expect(newState.data.PreferencesController).toStrictEqual({
      useBlockie: false,
      preferences: {
        avatarType: 'jazzicon',
      },
    });
  });
});
