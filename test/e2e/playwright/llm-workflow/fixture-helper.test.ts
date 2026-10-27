import { buildDefaultFixture, createFixturePresets } from './fixture-helper';

function expectSyncDisabled(fixture: ReturnType<typeof buildDefaultFixture>) {
  expect(fixture.data.UserStorageController).toMatchObject({
    isAccountSyncingEnabled: false,
    isBackupAndSyncEnabled: false,
    isContactSyncingEnabled: false,
    isRampsSyncingEnabled: false,
  });
}

function expectExternalServicesDisabled(
  fixture: ReturnType<typeof buildDefaultFixture>,
) {
  expect(fixture.data.PreferencesController).toMatchObject({
    useExternalServices: false,
  });
}

describe('buildDefaultFixture', () => {
  it('disables sync in the default fixture state', () => {
    expectSyncDisabled(buildDefaultFixture());
    expectExternalServicesDisabled(buildDefaultFixture());
  });

  it('disables sync in non-onboarding preset states', () => {
    const presets = createFixturePresets();

    expectSyncDisabled(presets.withMultipleAccounts());
    expectSyncDisabled(presets.withERC20Tokens());
    expectExternalServicesDisabled(presets.withMultipleAccounts());
    expectExternalServicesDisabled(presets.withERC20Tokens());
  });
});
