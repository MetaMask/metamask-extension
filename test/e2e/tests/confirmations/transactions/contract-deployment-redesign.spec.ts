/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { openDapp, unlockWallet } from '../../../helpers';
import {
  confirmDepositTransaction,
  confirmRedesignedContractDeploymentTransaction,
  createContractDeploymentTransaction,
  createDepositTransaction,
  TestSuiteArguments,
} from './shared';

const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');

describe('Confirmation Redesign Contract Deployment Component', function () {
  describe('Create a deploy transaction @no-mmi', function () {
    it(`Sends a contract interaction type 0 transaction (Legacy)`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: TestSuiteArguments) => {
          await unlockWallet(driver);

          await openDapp(driver);

          await createContractDeploymentTransaction(driver);

          await confirmRedesignedContractDeploymentTransaction(driver);

          // confirm deposits can be made to the deployed contract
          await createDepositTransaction(driver);

          await confirmDepositTransaction(driver);
        },
      );
    });

    it(`Sends a contract interaction type 2 transaction (EIP1559)`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .withPreferencesController({
              preferences: {
                redesignedConfirmationsEnabled: true,
                isRedesignedConfirmationsDeveloperEnabled: true,
              },
            })
            .build(),
          ganacheOptions: defaultGanacheOptionsForType2Transactions,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: TestSuiteArguments) => {
          await unlockWallet(driver);

          await openDapp(driver);

          await createContractDeploymentTransaction(driver);

          await confirmRedesignedContractDeploymentTransaction(driver);

          // confirm deposits can be made to the deployed contract
          await createDepositTransaction(driver);

          await confirmDepositTransaction(driver);
        },
      );
    });
  });
});
