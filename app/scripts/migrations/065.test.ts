/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import migration65 from './065';

type MigrationInput = Parameters<typeof migration65.migrate>[0];

describe('migration #65', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 64,
      },
      data: {},
    };

    const newStorage = await migration65.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.meta).toStrictEqual({
      version: 65,
    });
  });

  it('should move completedOnboarding from PreferencesController to OnboardingController when completedOnboarding is true', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          completedOnboarding: true,
          bar: 'baz',
        },
        OnboardingController: {
          foo: 'bar',
        },
      },
    };

    const newStorage = await migration65.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      OnboardingController: {
        completedOnboarding: true,
        foo: 'bar',
      },
    });
  });

  it('should move completedOnboarding from PreferencesController to OnboardingController when completedOnboarding is false', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          completedOnboarding: false,
          bar: 'baz',
        },
        OnboardingController: {
          foo: 'bar',
        },
      },
    };

    const newStorage = await migration65.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      OnboardingController: {
        completedOnboarding: false,
        foo: 'bar',
      },
    });
  });

  it('should move firstTimeFlowType from PreferencesController to OnboardingController when firstTimeFlowType is truthy', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          firstTimeFlowType: 'create',
          bar: 'baz',
        },
        OnboardingController: {
          foo: 'bar',
        },
      },
    };

    const newStorage = await migration65.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      OnboardingController: {
        firstTimeFlowType: 'create',
        foo: 'bar',
      },
    });
  });

  it('should move firstTimeFlowType from PreferencesController to OnboardingController when firstTimeFlowType is falsy', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          firstTimeFlowType: null,
          bar: 'baz',
        },
        OnboardingController: {
          foo: 'bar',
        },
      },
    };

    const newStorage = await migration65.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      OnboardingController: {
        firstTimeFlowType: null,
        foo: 'bar',
      },
    });
  });

  it('should not modify PreferencesController or OnboardingController when completedOnboarding and firstTimeFlowType are undefined', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PreferencesController: {
          bar: 'baz',
        },
        OnboardingController: {
          foo: 'bar',
        },
      },
    };

    const newStorage = await migration65.migrate(
      oldStorage as unknown as MigrationInput,
    );
    expect(newStorage.data).toStrictEqual({
      PreferencesController: {
        bar: 'baz',
      },
      OnboardingController: {
        foo: 'bar',
      },
    });
  });
});
