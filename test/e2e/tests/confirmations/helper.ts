import {
  defaultGanacheOptions,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';

export function withRedesignConfirmationFixtures (title: string = '', testFunction: Function) {
  return withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withPreferencesController({
          preferences: {
            redesignedConfirmationsEnabled: true,
          },
        })
        .build(),
      ganacheOptions: defaultGanacheOptions,
      title,
    },
    testFunction,
  );
}