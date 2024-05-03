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
      .withNetworkControllerOnMainnet()
        .withPermissionControllerConnectedToTestDapp()
        .withPreferencesController({
          preferences: {
            redesignedConfirmations: true,
          },
        })
        .build(),
      ganacheOptions: defaultGanacheOptions,
      title,
    },
    testFunction,
  );
}