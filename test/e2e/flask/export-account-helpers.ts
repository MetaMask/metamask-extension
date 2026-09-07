import { MockedEndpoint, Mockttp } from 'mockttp';
import { SubjectType } from '@metamask/permission-controller';
import { getCleanAppState } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';

export const PORTFOLIO_ORIGIN = 'https://portfolio.metamask.io';

export type ExportAccountResult = {
  success: boolean;
  error?: string;
};

/**
 * Serves a minimal HTML page for the portfolio origin. Chrome routes all
 * HTTPS through the mockttp proxy, so MetaMask's content script sees the
 * origin as https://portfolio.metamask.io.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked endpoints.
 */
export async function mockPortfolioOrigin(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const endpoint = await mockServer
    .forGet(/^https:\/\/portfolio\.metamask\.io\//u)
    .thenCallback(() => ({
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      body: '<!DOCTYPE html><html><head><title>Portfolio</title></head><body></body></html>',
    }));
  return [endpoint];
}

/**
 * Returns a fixture customizer that grants the given origin the
 * `wallet_snap` permission for the given snap, so the origin can call
 * `wallet_invokeKeyring` without going through the connect flow.
 *
 * @param snapId - The ID of the snap to grant permission for.
 * @param origin - The origin to grant the permission to.
 * @returns A fixture customizer.
 */
export function grantSnapPermission(snapId: string, origin: string) {
  return (builder: FixtureBuilderV2): FixtureBuilderV2 =>
    builder
      .withPermissionController({
        subjects: {
          [origin]: {
            origin,
            permissions: {
              /* eslint-disable @typescript-eslint/naming-convention */
              wallet_snap: {
                caveats: [{ type: 'snapIds', value: { [snapId]: {} } }],
                date: 1770296204693,
                id: `snap-perm-${origin}`,
                invoker: origin,
                parentCapability: 'wallet_snap',
              },
              /* eslint-enable @typescript-eslint/naming-convention */
            },
          },
        },
      })
      .withSubjectMetadataController({
        subjectMetadata: {
          [origin]: {
            origin,
            subjectType: SubjectType.Website,
            name: '',
            iconUrl: null,
            extensionId: null,
          },
        },
      });
}

/**
 * Finds the internal account ID for the given address in the app state.
 *
 * @param driver - The webdriver instance.
 * @param address - The address of the account to find.
 * @returns The internal account ID.
 */
export async function getAccountIdByAddress(driver: Driver, address: string) {
  const state = await getCleanAppState(driver);
  const accounts: Record<string, { id: string; address: string }> =
    state?.metamask?.internalAccounts?.accounts ?? {};
  const account = Object.values(accounts).find((a) => a.address === address);
  if (!account) {
    throw new Error(`Account with address ${address} not found in state`);
  }
  return account.id;
}

/**
 * Calls `keyring_exportAccount` on the given snap via `wallet_invokeKeyring`
 * from the currently open page, and returns whether the call succeeded.
 *
 * @param driver - The webdriver instance.
 * @param snapId - The ID of the snap to invoke.
 * @param accountId - The internal account ID to export.
 * @returns The result of the export attempt.
 */
export async function invokeKeyringExportAccount(
  driver: Driver,
  snapId: string,
  accountId: string,
): Promise<ExportAccountResult> {
  return await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const waitForEthereum = (resolve) => {
      if (window.ethereum) { resolve(); } else { setTimeout(() => waitForEthereum(resolve), 50); }
    };
    new Promise(waitForEthereum).then(() =>
      window.ethereum.request({
        method: 'wallet_invokeKeyring',
        params: {
          snapId: '${snapId}',
          request: { method: 'keyring_exportAccount', params: { id: '${accountId}' } }
        }
      })
    )
    .then(() => callback({ success: true }))
    .catch((e) => callback({ success: false, error: e.message }));
  `);
}
