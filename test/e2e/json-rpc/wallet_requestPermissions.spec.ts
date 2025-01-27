import { strict as assert } from 'assert';
import { PermissionConstraint } from '@metamask/permission-controller';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import TestDapp from '../page-objects/pages/test-dapp';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../shared/constants/permissions';
import { PermissionNames } from '../../../app/scripts/controllers/permissions';

describe('wallet_requestPermissions', function () {
  it('executes a request permissions on eth_accounts event', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.title,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // wallet_requestPermissions
        const requestPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsRequest})`,
        );

        // confirm connect account
        await testDapp.confirmConnectAccountModal();

        const getPermissionsRequest = JSON.stringify({
          method: 'wallet_getPermissions',
        });
        const getPermissions = await driver.executeScript(
          `return window.ethereum.request(${getPermissionsRequest})`,
        );

        const grantedPermissionNames = getPermissions
          .map(
            (permission: PermissionConstraint) => permission.parentCapability,
          )
          .sort();

        assert.deepStrictEqual(grantedPermissionNames, [
          'endowment:permitted-chains',
          'eth_accounts',
        ]);
      },
    );
  });

  it('should throw expected error if requested chain not available in metamask wallet extension', async function () {
    const UNAVAILABLE_CHAIN_ID = '0x2';
    const EXPECTED_ERROR = {
      value: `${PermissionNames.permittedChains} error: Received unrecognized chainId: "${UNAVAILABLE_CHAIN_ID}". Please try adding the network first via wallet_addEthereumChain.`,
      status: -32603,
    };

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        const requestPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestPermissions',
          params: [
            {
              [RestrictedMethods.eth_accounts]: {},
              [PermissionNames.permittedChains]: {
                caveats: [
                  {
                    type: CaveatTypes.restrictNetworkSwitching,
                    value: [UNAVAILABLE_CHAIN_ID],
                  },
                ],
              },
            },
          ],
        });

        /**
         * We should get back a message from the error object, with the format `javascript error: ${actual_error_object_here}`
         * So we used REGEX to parse that error object out, and check against it's actual `value`
         */
        const javascriptErrorMessage = await driver
          .executeScript(
            `return window.ethereum.request(${requestPermissionsRequest})`,
          )
          .then((data: unknown) => data)
          .catch((e: Error) => e.message);

        const jsonMatch = javascriptErrorMessage.match(/\{.*\}/u);
        const actualError = JSON.parse(jsonMatch[0]);

        assert.deepEqual(
          actualError,
          EXPECTED_ERROR,
          `calling wallet_requestPermissions should throw expected error when requesting chain id "${UNAVAILABLE_CHAIN_ID}" that is not available in wallet`,
        );
      },
    );
  });
});
