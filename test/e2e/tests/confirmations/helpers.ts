import {
  defaultGanacheOptions,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';

export function withRedesignConfirmationFixtures (title: string = '', testFunction: Function) {
  return withFixtures(
    {
      dapp: true,
      driverOptions: {
        timeOut: 20000,
      },
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