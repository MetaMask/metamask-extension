import sinon from 'sinon';
import { Mockttp, RulePriority } from 'mockttp';
import { hexToNumber } from '@metamask/utils';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SEND_ETH_REQUEST_MOCK } from '../simulation-details/mock-request-send-eth';
import { TX_SENTINEL_URL } from '../../../../shared/constants/transaction';
import { registerShieldServerMocks } from './mock';

export function withShieldFixtures(
  options: { title?: string },
  testSuite: (
    args: TestSuiteArguments & {
      gatewaySpy: sinon.SinonSpy;
      ruleEngineSpy: sinon.SinonSpy;
      mockServer: Mockttp;
    },
  ) => Promise<void>,
) {
  let gatewaySpy: sinon.SinonSpy;
  let ruleEngineSpy: sinon.SinonSpy;
  const inputChainId = CHAIN_IDS.MAINNET;
  return withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder({ inputChainId })
        .withPermissionControllerConnectedToTestDapp()
        .build(),
      localNodeOptions: {
        hardfork: 'london',
        chainId: hexToNumber(inputChainId),
      },
      title: options.title,
      testSpecificMock: async (server: Mockttp) => {
        ({ gatewaySpy, ruleEngineSpy } = await registerShieldServerMocks(
          server,
          RulePriority.DEFAULT + 1,
        ));

        await server
          .forPost(TX_SENTINEL_URL)
          .withJsonBodyIncluding(SEND_ETH_REQUEST_MOCK.request)
          .thenJson(200, SEND_ETH_REQUEST_MOCK.response);
      },
    },
    async ({ driver, mockServer }) => {
      return testSuite({ driver, gatewaySpy, ruleEngineSpy, mockServer });
    },
  );
}
