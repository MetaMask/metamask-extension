import { strict as assert } from 'assert';
import { RpcEndpointType } from '@metamask/network-controller';
import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import NetworkPolicyPage from '../../page-objects/pages/privacy/network-policy-page';
import TestDapp from '../../page-objects/pages/test-dapp';

const ALLOWED_RPC = 'https://customnetwork.test/rpc?key=saved';
const ALLOWED_REDIRECT = 'https://customnetwork.test/redirect';
const BLOCKED_URL = 'https://customnetwork.test/blocked';

async function mockPolicyRequests(mockServer: Mockttp) {
  return Promise.all([
    mockServer
      .forGet('https://customnetwork.test/rpc')
      .withExactQuery('?key=saved')
      .thenReply(200, 'allowed', { 'access-control-allow-origin': '*' }),
    mockServer.forGet(ALLOWED_REDIRECT).thenReply(302, '', {
      location: BLOCKED_URL,
      'access-control-allow-origin': '*',
    }),
    mockServer.forGet(BLOCKED_URL).thenReply(200, 'website traffic', {
      'access-control-allow-origin': '*',
    }),
  ]);
}

// Chrome's actual DNR matching, redirect checks, realm attribution, and delivery
// to the proxy cannot be proved by mocked browser APIs in a unit test.
describe('Browser network policy', function () {
  before(function () {
    if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
      this.skip();
    }
  });

  it('blocks remote requests before onboarding', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPolicyRequests,
        ignoredConsoleErrors: ['net::ERR_BLOCKED_BY_CLIENT', 'Failed to fetch'],
      },
      async ({ driver, mockedEndpoint: endpoints }) => {
        const policyPage = new NetworkPolicyPage(driver);
        await policyPage.openExtension();

        assert.equal((await policyPage.fetch(BLOCKED_URL)).reached, false);
        assert.equal(
          (await policyPage.fetchInBackground(BLOCKED_URL)).reached,
          false,
        );
        assert.equal((await endpoints[2].getSeenRequests()).length, 0);
      },
    );
  });

  it('restricts native extension realms to saved RPC URLs without affecting websites', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withUseBasicFunctionalityDisabled()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0x12345': {
                chainId: '0x12345',
                name: 'Network policy regression',
                nativeCurrency: 'ETH',
                blockExplorerUrls: [],
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [ALLOWED_RPC, ALLOWED_REDIRECT].map(
                  (url, index) => ({
                    url,
                    type: RpcEndpointType.Custom,
                    networkClientId: `network-policy-${index}`,
                  }),
                ),
              },
            },
          })
          .build(),
        dappOptions: { numberOfTestDapps: 1 },
        title: this.test?.fullTitle(),
        testSpecificMock: mockPolicyRequests,
        ignoredConsoleErrors: ['net::ERR_BLOCKED_BY_CLIENT', 'Failed to fetch'],
      },
      async ({ driver, mockedEndpoint: endpoints }) => {
        const policyPage = new NetworkPolicyPage(driver);
        await policyPage.openExtension();

        assert.equal((await policyPage.fetch(ALLOWED_RPC)).reached, true);
        assert.equal(
          (await policyPage.fetchInBackground(ALLOWED_RPC)).reached,
          true,
        );
        assert.equal((await policyPage.fetch(BLOCKED_URL)).reached, false);
        assert.equal(
          (await policyPage.fetchInBackground(BLOCKED_URL)).reached,
          false,
        );

        await policyPage.openNativeExtensionDocument();
        assert.equal((await policyPage.fetch(ALLOWED_RPC)).reached, true);
        assert.equal(
          (await policyPage.fetchInFreshFrame(BLOCKED_URL)).reached,
          false,
        );
        assert.equal(
          (await policyPage.fetchInBlobWorker(ALLOWED_RPC)).reached,
          true,
        );
        assert.equal(
          (await policyPage.fetchInBlobWorker(BLOCKED_URL)).reached,
          false,
        );
        assert.equal(
          (await policyPage.fetchWithPoisonedRequest(BLOCKED_URL)).reached,
          false,
        );
        assert.equal(
          (await policyPage.fetchInOpaqueSandbox(ALLOWED_RPC)).reached,
          true,
        );
        assert.equal(
          (await policyPage.fetchInOpaqueSandbox(BLOCKED_URL)).reached,
          false,
        );
        assert.equal(
          (
            await policyPage.fetchInOpaqueSandboxWorker(
              ALLOWED_RPC,
              ALLOWED_RPC,
            )
          ).reached,
          true,
        );
        assert.equal(
          (
            await policyPage.fetchInOpaqueSandboxWorker(
              BLOCKED_URL,
              ALLOWED_RPC,
            )
          ).reached,
          false,
        );
        assert.equal((await policyPage.fetch(ALLOWED_REDIRECT)).reached, false);
        assert.equal((await endpoints[1].getSeenRequests()).length, 1);
        assert.equal((await endpoints[2].getSeenRequests()).length, 0);

        const dapp = new TestDapp(driver);
        await dapp.openTestDappPage();
        assert.equal((await policyPage.fetch(BLOCKED_URL)).reached, true);
        assert.equal((await endpoints[2].getSeenRequests()).length, 1);
      },
    );
  });
});
